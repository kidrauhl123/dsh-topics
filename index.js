/**
 * Host half of the Topics bundle.
 *
 * Owns durable topic records (a topic is nothing but a name), serves the
 * authenticated routes the browser half calls, and tells each bound Session's
 * model which topic it belongs to.
 *
 * A topic is plain plugin data, not session state: the model-visible part is a
 * system-prompt section registered on the Agent's own context, so it disappears
 * with that Agent and is rebuilt from the record on resume.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** Stored document format version. */
/** v3: `prompt` is the full injected text (v2 appended it after the default). */
const STATE_VERSION = 3
/** Exact Fetch routes below `/api`, inside Connection's authentication fence. */
const ROUTE_STATE = '/api/topics.state'
const ROUTE_CREATE = '/api/topics.create'
const ROUTE_RENAME = '/api/topics.rename'
const ROUTE_UPDATE = '/api/topics.update'
const ROUTE_DELETE = '/api/topics.delete'
const ROUTE_SESSION = '/api/topics.session'
const ROUTE_BIND = '/api/topics.bind'
const ROUTE_MOVE = '/api/topics.move'
/** Prompt section name; unique inside the Agent scope. */
const SECTION_NAME = 'topic:instructions'

export const name = 'dsh-topics'
export const inject = ['agents', 'connection', 'sessionController', 'sessionQuery', 'systemPrompt', 'workspaceRegistry', 'workingDirectory']

/** Timestamp helper. */
const now = () => new Date().toISOString()

/** New record identity. */
const newId = () => `topic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Coerce one stored or submitted topic into the exact record shape.
 *
 * Only the name survives: a topic carries no prompt, notes, skills, or
 * directory, so a record written by an older version loads as its name alone.
 * @param value - untrusted record.
 * @param fallbackId - identity to keep when the value carries none.
 * @returns a normalized topic record, or undefined when it is unusable.
 */
function normalizeTopic(value, fallbackId) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const title = typeof value.title === 'string' ? value.title.trim() : ''
  if (title === '') return undefined
  const id = typeof value.id === 'string' && value.id !== '' ? value.id : fallbackId ?? newId()
  return {
    id,
    title,
    /* Free text appended to the topic section: instructions, notes, skill names. */
    prompt: typeof value.prompt === 'string' ? value.prompt : '',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now(),
  }
}

/**
 * Render the system-prompt text one topic contributes.
 * @param topic - the bound topic, or undefined when the Session has none.
 * @returns prompt text, empty when the topic contributes nothing.
 */
function renderTopic(topic) {
  if (topic === undefined) return ''
  const custom = typeof topic.prompt === 'string' ? topic.prompt.trim() : ''
  return custom === '' ? defaultPrompt(topic) : custom
}

/** The computed text a topic without its own prompt injects; follows renames. */
function defaultPrompt(topic) {
  return `# Topic: ${topic.title}\n\nThis Session belongs to the "${topic.title}" topic.`
}

/**
 * Read one request body as a JSON object.
 * @param request - incoming Fetch request.
 * @returns the decoded object, or an empty object when the body is unusable.
 */
async function readJson(request) {
  try {
    const value = await request.json()
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

/** One JSON response. */
const json = (value) => Response.json(value, { headers: { 'cache-control': 'no-store' } })

/**
 * Register topic storage, the browser routes, and per-Session prompt binding.
 * @param ctx - Host context carrying storage-free plugin data and the Agent registry.
 */
export function apply(ctx) {
  const file = join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'topics', 'topics.json')
  const state = { version: STATE_VERSION, topics: [], bindings: {} }
  /** One in-flight operation at a time; the file is the durable medium. */
  let tail = Promise.resolve()
  /** sessionId → { topicId, fiber } for live bound Agents. */
  const fibers = new Map()
  /* One shared read: every caller waits for the same load, so nothing sees an
     empty state while the file is still being read. */
  let loading

  const load = () => (loading ??= readState())

  const readState = async () => {
    let migrated = false
    try {
      const parsed = JSON.parse(await readFile(file, 'utf8'))
      if (Array.isArray(parsed.topics)) {
        for (const raw of parsed.topics) {
          const topic = normalizeTopic(raw)
          if (topic === undefined) continue
          /* v2 appended `prompt` after the default text; keep what it injected. */
          if (!(parsed.version >= 3) && topic.prompt.trim() !== '') {
            topic.prompt = `${defaultPrompt(topic)}\n\n${topic.prompt.trim()}`
            migrated = true
          }
          state.topics.push(topic)
        }
      }
      if (typeof parsed.bindings === 'object' && parsed.bindings !== null) {
        for (const [sessionId, topicId] of Object.entries(parsed.bindings)) {
          if (typeof topicId === 'string' && state.topics.some((topic) => topic.id === topicId)) state.bindings[sessionId] = topicId
        }
      }
      if (migrated) await persist()
    } catch (error) {
      if (error?.code !== 'ENOENT') ctx.logger?.warn?.(`topics: could not read ${file}: ${String(error)}`)
    }
  }

  const persist = async () => {
    await mkdir(dirname(file), { recursive: true })
    const temporary = `${file}.${process.pid}.tmp`
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    await rename(temporary, file)
  }

  /** Serialize mutations so two routes never interleave a read-modify-write. */
  const serialize = (task) => {
    const run = tail.then(task, task)
    tail = run.then(() => undefined, () => undefined)
    return run
  }

  const topicOf = (sessionId) => {
    const topicId = state.bindings[sessionId]
    if (topicId === undefined) return undefined
    return state.topics.find((topic) => topic.id === topicId)
  }

  const disposeFiber = (sessionId) => {
    const entry = fibers.get(sessionId)
    if (entry === undefined) return
    fibers.delete(sessionId)
    try {
      /* Disposal is asynchronous, and the Agent scope may already be closed, so
         the returned promise is drained rather than awaited by callers that run
         inside another scope's teardown. */
      const task = entry.fiber.dispose()
      if (task !== undefined && typeof task.then === 'function') task.then(undefined, () => {})
    } catch {
      /* the Agent scope may already be closed */
    }
  }

  const install = (agent) => {
    const topic = topicOf(agent.id)
    const existing = fibers.get(agent.id)
    if (existing !== undefined) {
      if (topic !== undefined && existing.topicId === topic.id) return undefined
      disposeFiber(agent.id)
    }
    if (topic === undefined) return undefined
    let fiber
    try {
      fiber = agent.ctx.inject(['systemPrompt'], (scope) => {
        scope.systemPrompt.section({
          name: SECTION_NAME,
          /* Deployment persona sits at 0; a topic statement belongs right after
             the identity and before any tool guidance. */
          order: 1,
          interpolate: false,
          /* Read through the binding at assembly time, so a rename applies to
             Sessions that are already running without re-registering. */
          text: () => renderTopic(topicOf(agent.id)),
        })
      })
    } catch (error) {
      ctx.logger?.warn?.(`topics: could not attach the topic section to ${agent.id}: ${String(error)}`)
      return undefined
    }
    fibers.set(agent.id, { topicId: topic.id, fiber })
    return fiber
  }

  /**
   * Session ids the shipped sidebar can actually show, i.e. members of a
   * registered Workspace.
   *
   * A Session that belongs to no Workspace has no row anywhere and cannot be
   * reopened without asking which Workspace to use, so it is not a usable topic
   * member. Earlier builds could bind exactly such Sessions; dropping them here
   * clears their stranded "未命名会话" rows without touching any Session log.
   * @returns the id set, or undefined when membership cannot be read.
   */
  const ownedSessions = () => {
    const owned = new Set()
    try {
      for (const workspace of ctx.workspaceRegistry.list()) {
        for (const sessionId of workspace.sessionIds ?? []) owned.add(sessionId)
      }
    } catch (error) {
      ctx.logger?.warn?.(`topics: could not read Workspace membership: ${String(error)}`)
      return undefined
    }
    return owned
  }

  /**
   * Session ids per topic, in the order their bindings were recorded.
   * @returns topic id → bound Session ids.
   */
  const membersOf = () => {
    const rows = new Map()
    const owned = ownedSessions()
    for (const [sessionId, topicId] of Object.entries(state.bindings)) {
      if (owned !== undefined && !owned.has(sessionId)) continue
      const list = rows.get(topicId)
      if (list === undefined) rows.set(topicId, [sessionId])
      else list.push(sessionId)
    }
    return rows
  }

  /**
   * Read display titles for bound Sessions.
   *
   * The sidebar groups by title, so a missing title would render as an empty row.
   * Titles are read in one batch and a failed read degrades to no title rather
   * than failing the whole state request: the sidebar is not worth breaking over
   * a label.
   * @param sessionIds - ids to label.
   * @returns session id → title, for the ids that have one.
   */
  const titlesOf = async (sessionIds) => {
    const titles = {}
    if (sessionIds.length === 0) return titles
    try {
      const rows = await ctx.sessionQuery.readTitleSnapshots(sessionIds)
      for (const row of rows) {
        const id = row?.sessionId
        const title = row?.title?.title
        if (typeof id === 'string' && typeof title === 'string' && title !== '') titles[id] = title
      }
    } catch (error) {
      ctx.logger?.warn?.(`topics: could not read Session titles: ${String(error)}`)
    }
    return titles
  }

  const view = async () => {
    const members = membersOf()
    const all = [...members.values()].flat()
    const titles = await titlesOf(all)
    const workspace = await workspaceFor()
    return {
      version: STATE_VERSION,
      defaultCwd: ctx.workingDirectory.defaultDirectory,
      /* The Workspace a topic would create its next Session in. The browser needs
         it to reuse that Workspace's blank Session, the way the shipped sidebar
         does, instead of opening a Session that has no home. */
      workspaceId: workspace?.id,
      topics: state.topics.map((topic) => ({
        ...topic,
        /* The exact text this topic adds to a bound Session's system prompt, so
           the sidebar menu can show what a topic actually contributes. */
        rendered: renderTopic(topic),
        sessionIds: members.get(topic.id) ?? [],
        sessions: (members.get(topic.id) ?? []).map((sessionId) => ({ sessionId, title: titles[sessionId] ?? '' })),
      })),
    }
  }

  /**
   * A state response, optionally carrying a result field.
   *
   * Every mutation answers with the whole view so the sidebar and the panel
   * update from one round trip instead of racing a second read.
   * @param extra - fields to merge over the view.
   * @returns the JSON response.
   */
  const respond = async (extra) => json({ ...extra, ...(await view()) })

  /**
   * Pick the Workspace a topic's new Session belongs to.
   *
   * Every Session lives in a Workspace, and a Session created outside one opens
   * behind a "pick a Workspace" prompt — so a topic never creates a Session
   * without a home. The default directory wins when it is itself a registered
   * Workspace; otherwise the most recently touched Workspace is the best guess,
   * and the first registered one is the last resort.
   * @returns the Workspace, or undefined when none is registered.
   */
  const workspaceFor = async () => {
    try {
      const byPath = await ctx.workspaceRegistry.resolveByPath(ctx.workingDirectory.defaultDirectory)
      if (byPath !== undefined) return byPath
    } catch {
      /* the default directory need not be a registered Workspace */
    }
    let all = []
    try {
      all = ctx.workspaceRegistry.list()
    } catch {
      return undefined
    }
    if (all.length === 0) return undefined
    let best = all[0]
    for (const workspace of all) {
      if (String(workspace.updatedAt ?? '') > String(best.updatedAt ?? '')) best = workspace
    }
    return best
  }

  /** Resolve a Session creation target that always carries a Workspace. */
  const defaultTarget = async () => {
    const workspace = await workspaceFor()
    if (workspace !== undefined) return { workspaceId: workspace.id }
    return { cwd: ctx.workingDirectory.defaultDirectory }
  }

  /**
   * Create one Session in the default directory and bind it to a topic.
   *
   * Session creation runs outside the storage lock because it dispatches
   * `agent/created` and may wait on other plugins; the binding is recorded
   * afterwards, under the lock. A Session that fails to bind still exists, which
   * is why the failure is reported rather than swallowed.
   * @param topic - the topic the new Session belongs to.
   * @returns the new Session id.
   */
  const startSession = async (topic) => {
    const created = await ctx.sessionController.create(await defaultTarget())
    const sessionId = created.sessionId
    await serialize(async () => {
      state.bindings[sessionId] = topic.id
      await persist()
    })
    const agent = ctx.agents.get(sessionId)
    if (agent !== undefined) await install(agent)
    return sessionId
  }

  ctx.on('agent/created', async ({ agent }) => {
    await load()
    await install(agent)
  })
  ctx.on('agent/disposed', ({ agent }) => disposeFiber(agent.id))
  ctx.effect(() => () => {
    for (const sessionId of [...fibers.keys()]) disposeFiber(sessionId)
  }, 'topics: prompt sections')

  ctx.connection.fetch.register({
    path: ROUTE_STATE,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async () => {
      await load()
      return json(await view())
    },
  })

  /* One click in the workspace header: name a topic. A topic starts empty. */
  ctx.connection.fetch.register({
    path: ROUTE_CREATE,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const body = await readJson(request)
      /* Record (or reuse) the name under the lock, so two clicks cannot create
         two records for the same name. */
      const claimed = await serialize(async () => {
        await load()
        const incoming = normalizeTopic({ title: body.title })
        if (incoming === undefined) return undefined
        const duplicate = state.topics.find((topic) => topic.title === incoming.title)
        if (duplicate !== undefined) return duplicate
        const topic = { ...incoming, id: newId(), createdAt: now(), updatedAt: now() }
        state.topics.push(topic)
        await persist()
        return topic
      })
      if (claimed === undefined) return await respond({ error: 'topic name is required' })
      /* A topic starts empty on purpose: it is a place to collect Sessions, not a
         Session factory. Sessions arrive through the Session menu, or through the
         explicit "new Session in this topic" action. */
      return await respond({ topicId: claimed.id })
    },
  })

  ctx.connection.fetch.register({
    path: ROUTE_RENAME,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const body = await readJson(request)
      return serialize(async () => {
        await load()
        const id = typeof body.id === 'string' ? body.id : ''
        const title = typeof body.title === 'string' ? body.title.trim() : ''
        if (title === '') return await respond({ error: 'topic name is required' })
        const index = state.topics.findIndex((topic) => topic.id === id)
        if (index === -1) return await respond({ error: `unknown topic "${id}"` })
        state.topics[index] = { ...state.topics[index], title, updatedAt: now() }
        await persist()
        /* Section text is a provider read at assembly time, so edits apply without re-registering. */
        return json(await view())
      })
    },
  })

  /* Edit the topic's own prompt text; bound Sessions read it at assembly time. */
  ctx.connection.fetch.register({
    path: ROUTE_UPDATE,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const body = await readJson(request)
      return serialize(async () => {
        await load()
        const id = typeof body.id === 'string' ? body.id : ''
        if (typeof body.prompt !== 'string') return await respond({ error: 'prompt must be a string' })
        const index = state.topics.findIndex((topic) => topic.id === id)
        if (index === -1) return await respond({ error: `unknown topic "${id}"` })
        /* Empty, or exactly the default, stores nothing so the default keeps following renames. */
        const text = body.prompt.trim()
        const prompt = text === '' || text === defaultPrompt(state.topics[index]) ? '' : text
        state.topics[index] = { ...state.topics[index], prompt, updatedAt: now() }
        await persist()
        return json(await view())
      })
    },
  })

  ctx.connection.fetch.register({
    path: ROUTE_DELETE,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const body = await readJson(request)
      return serialize(async () => {
        await load()
        const id = typeof body.id === 'string' ? body.id : ''
        state.topics = state.topics.filter((topic) => topic.id !== id)
        for (const [sessionId, topicId] of Object.entries(state.bindings)) {
          if (topicId === id) {
            delete state.bindings[sessionId]
            disposeFiber(sessionId)
          }
        }
        await persist()
        return json(await view())
      })
    },
  })

  ctx.connection.fetch.register({
    path: ROUTE_SESSION,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const body = await readJson(request)
      const id = typeof body.id === 'string' ? body.id : ''
      const topic = await serialize(async () => {
        await load()
        return state.topics.find((item) => item.id === id)
      })
      if (topic === undefined) return await respond({ error: `unknown topic "${id}"` })
      try {
        return await respond({ sessionId: await startSession(topic) })
      } catch (error) {
        return await respond({ error: `could not create a Session: ${String(error?.message ?? error)}` })
      }
    },
  })

  ctx.connection.fetch.register({
    path: ROUTE_BIND,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const body = await readJson(request)
      return serialize(async () => {
        await load()
        const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
        if (sessionId === '') return await respond({ error: 'sessionId is required' })
        const topicId = typeof body.topicId === 'string' && body.topicId !== '' ? body.topicId : undefined
        if (topicId === undefined) delete state.bindings[sessionId]
        else if (!state.topics.some((topic) => topic.id === topicId)) return await respond({ error: `unknown topic "${topicId}"` })
        else state.bindings[sessionId] = topicId
        await persist()
        const agent = ctx.agents.get(sessionId)
        if (agent === undefined) disposeFiber(sessionId)
        else await install(agent)
        return json(await view())
      })
    },
  })

  /**
   * Move one topic, or one Session, in the stored order.
   *
   * Order is the only thing a drag writes: a topic's place in the sidebar is
   * its index in `topics`, and a Session's place inside a topic is the
   * insertion order of `bindings`. Both are rebuilt in the new order and
   * persisted once, so the sidebar and the panel come back with the same view
   * a plain read would produce.
   */
  ctx.connection.fetch.register({
    path: ROUTE_MOVE,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const body = await readJson(request)
      const before = typeof body.before === 'string' && body.before !== '' ? body.before : undefined
      return serialize(async () => {
        await load()
        if (body.kind === 'topic') {
          const id = typeof body.id === 'string' ? body.id : ''
          const from = state.topics.findIndex((topic) => topic.id === id)
          if (from === -1) return await respond({ error: `unknown topic "${id}"` })
          const [topic] = state.topics.splice(from, 1)
          const at = before === undefined ? state.topics.length : state.topics.findIndex((item) => item.id === before)
          state.topics.splice(at === -1 ? state.topics.length : at, 0, topic)
        } else if (body.kind === 'session') {
          const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
          const topicId = typeof body.topicId === 'string' && body.topicId !== '' ? body.topicId : undefined
          if (sessionId === '' || topicId === undefined) return await respond({ error: 'sessionId and topicId are required' })
          if (!state.topics.some((topic) => topic.id === topicId)) return await respond({ error: `unknown topic "${topicId}"` })
          const entries = Object.entries(state.bindings).filter(([id]) => id !== sessionId)
          let at = before === undefined ? -1 : entries.findIndex(([id]) => id === before)
          if (at === -1) {
            /* No neighbour named: append after the last Session already there. */
            let last = -1
            for (let index = 0; index < entries.length; index += 1) if (entries[index][1] === topicId) last = index
            at = last === -1 ? entries.length : last + 1
          }
          entries.splice(at, 0, [sessionId, topicId])
          state.bindings = Object.fromEntries(entries)
          /* A Session that changed topic reads a different prompt statement. */
          const agent = ctx.agents.get(sessionId)
          if (agent === undefined) disposeFiber(sessionId)
          else await install(agent)
        } else {
          return await respond({ error: `unknown move kind "${String(body.kind)}"` })
        }
        await persist()
        return json(await view())
      })
    },
  })

  /* Agents restored before this plugin loaded its file still need their topic. */
  load().then(() => {
    for (const agent of ctx.agents.list()) install(agent)
  }, (error) => ctx.logger?.warn?.(`topics: could not load: ${String(error)}`))
}
