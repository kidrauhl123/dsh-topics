/**
 * Browser half of the Topics bundle.
 *
 * A topic is a name and nothing else. The product surface is one "#" button
 * placed in the workspace section header, beside the shipped search /
 * view-options / add-workspace buttons: click it and type a name. The topic
 * then appears in the sidebar as its own "#name" group, a peer of the
 * workspace groups, and starts empty — a topic is a place to collect Sessions,
 * not a Session that has not been used yet.
 *
 * Both surfaces are plain DOM mounted into the shipped sidebar, because the
 * browser hardcodes its own header and exposes no group-level slot. React owns
 * those elements, so a MutationObserver puts ours back whenever React
 * reconciles them; class names are matched by their semantic suffix, never by
 * the hashed prefix a build happens to produce.
 *
 * Every colour comes from a `--dsw-alias-*` / `--dsw-specific-*` theme token,
 * so light and dark follow the app theme without a second palette.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-topics',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { createRoot } = require('react-dom/client')
    const ui = require('@deepseek-ai/dsh-client-ui-primitives')
    const {
      Menu,
      MenuGroup,
      MenuItemButton,
      Tooltip,
      IconEllipsisOutlineRegular,
      IconPinOutlineRegular,
      IconPinFillRegular,
      IconArchiveOutlineRegular,
      IconUnarchiveOutlineRegular,
      IconEditOutlineRegular,
      IconBranchOutlineRegular,
      IconCopyOutlineRegular,
      IconCheckOutlineRegular,
    } = ui

    const NS = 'topics'
    const CSS_MARK = 'data-dsh-topics-css'

    const zh = {
      'panel': '话题',
      'title': '话题',
      'subtitle': '点工作区右边的 # 起一个话题；话题会像工作区分组一样出现在侧栏，会话都归在它下面。',
      'create': '新建话题',
      'createTitle': '新建话题',
      'renameTitle': '重命名话题',
      'nameLabel': '给这个话题起个名字',
      'namePlaceholder': '例如：论文、重构、客服问答',
      'createConfirm': '创建',
      'renameConfirm': '保存',
      'cancel': '取消',
      'empty': '还没有话题。点右上角的 # 起一个。',
      'loading': '正在读取话题…',
      'error': '读取话题失败',
      'retry': '重试',
      'delete': '删除',
      'rename': '重命名',
      'open': '打开会话',
      'sessionsCount': '{n} 个会话',
      'nameRequired': '请先填一个名字',
      'saving': '正在创建…',
      'addAria': '新建话题',
      'menu.bind': '归到话题',
      'menu.unbind': '不归任何话题',
      'mark.aria': '属于话题',
      'group.newSession': '在这个话题里新建会话',
      'actions.aria': '话题操作',
      'details': '详情',
      'detailsTitle': '话题详情',
      'detailsPrompt': '注入给模型的提示词',
      'detailsEditAria': '编辑提示词',
      'detailsEditPlaceholder': '留空则使用默认（# Topic: 话题名 …）',
      'detailsSave': '保存',
      'detailsSaving': '正在保存…',
      'detailsSessions': '会话',
      'detailsCreated': '创建于',
      'detailsNoSessions': '还没有会话',
      'close': '关闭',
      'group.empty': '还没有会话',
      'group.untitled': '未命名会话',
      'row.new': '新会话',
      'menu.pinSession': '置顶会话',
      'menu.unpinSession': '取消置顶',
      'menu.renameSession': '重命名',
      'menu.fork': '分叉会话',
      'menu.archiveSession': '归档会话',
      'menu.unarchiveSession': '取消归档',
      'menu.sessionId': '复制 Session ID',
      'actions.session.aria': '会话“{name}”的操作',
      'actions.archive': '归档会话',
      'actions.unarchive': '取消归档',
      'actions.pin': '置顶会话',
      'actions.unpin': '取消置顶',
    }

    const en = {
      'panel': 'Topics',
      'title': 'Topics',
      'subtitle': 'Click # beside the Workspaces header to name a topic; it appears in the sidebar like a workspace group, and its Sessions live under it.',
      'create': 'New topic',
      'createTitle': 'New topic',
      'renameTitle': 'Rename topic',
      'nameLabel': 'Name this topic',
      'namePlaceholder': 'e.g. Thesis, Refactor, Support answers',
      'createConfirm': 'Create',
      'renameConfirm': 'Save',
      'cancel': 'Cancel',
      'empty': 'No topics yet. Click # at the top right to name one.',
      'loading': 'Loading topics…',
      'error': 'Could not load topics',
      'retry': 'Retry',
      'delete': 'Delete',
      'rename': 'Rename',
      'open': 'Open Session',
      'sessionsCount': '{n} Sessions',
      'nameRequired': 'A name is required',
      'saving': 'Creating…',
      'addAria': 'New topic',
      'menu.bind': 'Assign to topic',
      'menu.unbind': 'No topic',
      'mark.aria': 'Belongs to a topic',
      'group.newSession': 'New Session in this topic',
      'actions.aria': 'Topic actions',
      'details': 'Details',
      'detailsTitle': 'Topic details',
      'detailsPrompt': 'Prompt injected into the model',
      'detailsEditAria': 'Edit prompt',
      'detailsEditPlaceholder': 'Leave empty to use the default (# Topic: name …)',
      'detailsSave': 'Save',
      'detailsSaving': 'Saving…',
      'detailsSessions': 'Sessions',
      'detailsCreated': 'Created',
      'detailsNoSessions': 'No Sessions yet',
      'close': 'Close',
      'group.empty': 'No Sessions yet',
      'group.untitled': 'Untitled Session',
      'row.new': 'New Session',
      'menu.pinSession': 'Pin session',
      'menu.unpinSession': 'Unpin session',
      'menu.renameSession': 'Rename',
      'menu.fork': 'Fork session',
      'menu.archiveSession': 'Archive session',
      'menu.unarchiveSession': 'Unarchive session',
      'menu.sessionId': 'Copy Session ID',
      'actions.session.aria': 'Actions for session "{name}"',
      'actions.archive': 'Archive session',
      'actions.unarchive': 'Unarchive session',
      'actions.pin': 'Pin session',
      'actions.unpin': 'Unpin session',
    }

    /**
     * Stylesheet. Geometry and colour mirror the shipped controls: the header
     * button copies `.iconButton` (28×28 wide, 36×36 in the rail), the dialog
     * copies the shipped menu/modal surface, and every colour is a mode-aware
     * theme token so dark mode needs no second palette.
     */
    const CSS = `
.dsh-topics-add{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;margin:0;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;line-height:1}
.dsh-topics-add:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-topics-add:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}
.dsh-topics-add[data-rail="1"]{width:36px;height:36px;border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-primary)}

.dsh-topics-scrim{position:fixed;inset:0;z-index:1100;display:flex;align-items:flex-start;justify-content:center;padding:18vh 24px 24px;background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur)}
.dsh-topics-dialog{box-sizing:border-box;width:min(420px,100%);padding:20px;border:0;border-radius:var(--dsw-radius-lg);background:var(--dsw-specific-menu);backdrop-filter:var(--dsw-menu-backdrop-filter);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:14px;line-height:22px}
.dsh-topics-dialog-title{margin:0;font-size:16px;font-weight:500;line-height:24px}
.dsh-topics-dialog-hint{margin:4px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-topics-input{box-sizing:border-box;width:100%;height:44px;margin:14px 0 0;padding:7px 14px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-lg);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;font-weight:400;line-height:22px}
.dsh-topics-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.dsh-topics-input:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}
.dsh-topics-error{margin:10px 0 0;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}
.dsh-topics-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
.dsh-topics-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;height:36px;padding:0 14px;border:0;border-radius:var(--dsw-radius-md);font:inherit;font-size:14px;line-height:22px;cursor:pointer;white-space:nowrap}
.dsh-topics-btn:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}
.dsh-topics-btn:disabled{opacity:.4;cursor:default}
.dsh-topics-btn--plain{border:.5px solid var(--dsw-alias-border-l3);background:0 0;color:var(--dsw-alias-label-primary)}
.dsh-topics-btn--plain:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh-topics-btn--primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.dsh-topics-btn--primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.dsh-topics-btn--sm{height:28px;padding:0 10px;border-radius:var(--dsw-radius-sm);font-size:12px;line-height:18px}
.dsh-topics-btn--new{height:32px;padding:0 12px;border-radius:16px;font-size:13px;line-height:20px}

.dsh-topics-page{width:100%;min-width:0;height:100%;min-height:0;overflow-y:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:14px;line-height:1.6}
.dsh-topics-page-inner{max-width:960px;margin:0 auto;padding:0 clamp(24px,4vw,48px) 48px}
.dsh-topics-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:8px;padding-top:28px}
[data-platform="darwin"] .dsh-topics-head{padding-top:calc(28px + var(--dsh-frame-top-clearance,0px))}
.dsh-topics-h1{margin:0;font-size:20px;font-weight:500;line-height:28px}
.dsh-topics-sub{margin:0 0 24px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-topics-failure{margin:0 0 12px;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}
.dsh-topics-list{display:flex;flex-direction:column;margin:0;padding:0;list-style:none}
.dsh-topics-row{display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:var(--dsw-radius-md);transition:background .12s var(--ds-ease-in-out)}
.dsh-topics-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-topics-row-hash{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;color:var(--dsw-alias-label-tertiary)}
.dsh-topics-row-main{flex:1;min-width:0}
.dsh-topics-row-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:22px}
.dsh-topics-row-meta{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-topics-row-actions{display:flex;flex:none;gap:4px;opacity:0;transition:opacity .12s var(--ds-ease-in-out)}
.dsh-topics-row:hover .dsh-topics-row-actions,.dsh-topics-row:focus-within .dsh-topics-row-actions{opacity:1}
.dsh-topics-empty{margin:0;padding:40px 20px;color:var(--dsw-alias-label-tertiary);text-align:center;font-size:14px;line-height:22px}
.dsh-topics-mark{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-tertiary)}
.dsh-topics-menu-label{padding:4px 7px 2px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.dsh-topics-menu-row{display:block;width:100%;padding:4px 7px;border:0;border-radius:var(--dsw-radius-md);background:0 0;color:var(--dsw-alias-label-primary);text-align:left;font:inherit;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px);line-height:20px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-topics-menu-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-topics-menu-row[data-current="1"]{color:var(--dsw-alias-brand-primary)}
.dsh-topics-groups{display:flex;flex-direction:column;flex:none;margin-bottom:4px}
.dsh-topics-group{position:relative;display:flex;flex-direction:column}
.dsh-topics-group+.dsh-topics-group{margin-top:4px}
.dsh-topics-group>*+*{margin-top:2px}

/* Group row and Session row copy the shipped rows' geometry exactly: the same
   34px/32px heights, the same 8px inset with the workspace indent variable, and
   the same 16x20 leading slots, so a topic title lines up with a workspace title
   and a topic's Sessions line up with the Sessions beside them. */
.dsh-topics-projectRow{box-sizing:border-box;display:flex;align-items:center;gap:6px;height:34px;padding:0 8px;padding-inline-start:calc(8px + var(--dsh-workspace-indent,0px));border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-primary);cursor:pointer;user-select:none}
.dsh-topics-projectRow:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-topics-projectRow:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}

/* The "#" and the expander share one slot, exactly like the shipped row's
   folder/chevron swap: the mark at rest, the triangle once the row is hovered. */
.dsh-topics-mark,.dsh-topics-chevron{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:20px;color:var(--dsw-alias-label-tertiary)}
.dsh-topics-chevron{display:none;color:var(--dsw-alias-label-caption)}
.dsh-topics-projectRow:hover .dsh-topics-chevron{display:inline-flex}
.dsh-topics-projectRow:hover .dsh-topics-mark{display:none}
.dsh-topics-arrow{display:block;transition:transform .15s var(--ds-ease-in-out)}
.dsh-topics-projectRow[data-open="1"] .dsh-topics-arrow{transform:rotate(90deg)}

.dsh-topics-projectText{display:flex;flex-direction:column;flex:1;gap:2px;min-width:0}
.dsh-topics-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px}

.dsh-topics-rowActions{flex:none;display:none;align-items:center;gap:15px}
.dsh-topics-projectRow:hover .dsh-topics-rowActions,.dsh-topics-projectRow[data-menu="1"] .dsh-topics-rowActions,.dsh-topics-sessionRow:hover .dsh-topics-rowActions,.dsh-topics-sessionRow[data-menu="1"] .dsh-topics-rowActions{display:inline-flex}
.dsh-topics-sessionRow:hover [class*="_time"],.dsh-topics-sessionRow[data-menu="1"] [class*="_time"],.dsh-topics-sessionRow:hover .dsh-topics-pinIndicator,.dsh-topics-sessionRow[data-menu="1"] .dsh-topics-pinIndicator{display:none}
.dsh-topics-iconButton{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:0;border-radius:var(--dsw-radius-xs);background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;flex:none}
.dsh-topics-iconButton:hover{color:var(--dsw-alias-label-primary)}
.dsh-topics-iconButton:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:0}
.dsh-topics-pinIndicator{width:16px;height:20px;margin-left:6px;color:var(--dsw-alias-label-caption);flex:none;display:inline-flex;align-items:center;justify-content:center}

.dsh-topics-sessionRow{box-sizing:border-box;display:flex;align-items:center;gap:0;height:32px;padding:0 8px;padding-inline-start:calc(8px + var(--dsh-workspace-indent,0px));border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-primary);cursor:pointer;user-select:none}
.dsh-topics-sessionRow:hover,.dsh-topics-sessionRow[data-selected="1"],.dsh-topics-sessionRow[data-menu="1"]{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-topics-sessionRow:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}
.dsh-topics-sessionSlot{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:20px}
.dsh-topics-sessionTitle{flex:1;min-width:0;margin:0 6px 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px}
@media (hover:hover){.dsh-topics-sessionRow:hover .dsh-topics-sessionTitle,.dsh-topics-sessionRow[data-menu="1"] .dsh-topics-sessionTitle{text-overflow:clip}}

/* The read-only details sheet reuses the dialog surface; only the prompt block
   and the key/value rows are its own. */
.dsh-topics-dialog--details{width:min(520px,calc(100vw - 48px))}
.dsh-topics-details{margin:0;display:flex;flex-direction:column;gap:10px;font-size:13px;line-height:20px}
.dsh-topics-detailRow{display:flex;gap:12px;align-items:baseline}
.dsh-topics-detailKey{flex:none;width:72px;color:var(--dsw-alias-label-tertiary)}
.dsh-topics-detailValue{flex:1;min-width:0;color:var(--dsw-alias-label-primary);word-break:break-word}
.dsh-topics-prompt{margin:2px 0 0;padding:10px 12px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12px;line-height:18px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto}
.dsh-topics-promptBox{position:relative}
.dsh-topics-promptBox [hidden]{display:none!important}
.dsh-topics-promptBox .dsh-topics-prompt{padding-right:34px}
.dsh-topics-promptEdit{position:absolute;top:8px;right:8px}
.dsh-topics-promptActions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
.dsh-topics-promptHint{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}

/* Empty topics are a normal state; the hint sits where a Session title would. */
.dsh-topics-groupEmpty{padding:6px 8px 6px calc(28px + var(--dsh-workspace-indent,0px));color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}

/* Drop indicator, copied from the shipped workspace drag: a chevron-shaped line
   in the business colour, drawn above or below the row being dropped onto. */
.dsh-topics-group[data-drop="before"]:before,.dsh-topics-group[data-drop="after"]:after,.dsh-topics-sessionRow[data-drop="before"]:before,.dsh-topics-sessionRow[data-drop="after"]:after{content:"";z-index:1;background:linear-gradient(55deg,transparent calc(50% - 1px),var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px),transparent calc(50% + 1px)) 0 0/5px 7px no-repeat,linear-gradient(125deg,transparent calc(50% - 1px),var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px),transparent calc(50% + 1px)) 0 5px/5px 7px no-repeat,linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px/calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}
.dsh-topics-group[data-drop="before"]:before,.dsh-topics-sessionRow[data-drop="before"]:before{top:-7px}
.dsh-topics-group[data-drop="after"]:after,.dsh-topics-sessionRow[data-drop="after"]:after{bottom:-7px}
.dsh-topics-sessionRow[data-drop]{position:relative}

/* The row menu surfaces the two actions a topic has, in the shipped menu
   surface (same blur, elevation and radius as every other popover). */
.dsh-topics-popover{position:fixed;z-index:1100;min-width:168px;padding:4px;border-radius:var(--dsw-radius-lg);background:var(--dsw-specific-menu);backdrop-filter:var(--dsw-menu-backdrop-filter);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);font-family:var(--dsw-font-family)}
.dsh-topics-popover-row{display:flex;align-items:center;width:100%;padding:6px 8px;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-primary);text-align:left;font:inherit;font-size:13px;line-height:20px;cursor:pointer}
.dsh-topics-popover-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-topics-popover-row[data-danger="1"]{color:var(--dsw-alias-state-error-primary)}
.dsh-topics-popover-sep{height:1px;margin:4px 0;background:var(--dsw-alias-border-l2)}
`

    /** Snapshot shape the page and the row decorations both read. */
    const emptySnapshot = { status: 'loading', topics: [], workspaceId: undefined, error: null }

    /**
     * Page-local topic store over the Host's authenticated routes.
     * @returns snapshot read, subscription, and the mutations.
     */
    function createTopicStore() {
      let snapshot = emptySnapshot
      const listeners = new Set()
      let inflight = null

      const publish = (next) => {
        snapshot = next
        for (const listener of [...listeners]) listener()
      }

      const adopt = (value, fallbackError) => {
        publish({
          status: 'ready',
          topics: Array.isArray(value.topics) ? value.topics : [],
          /* The Workspace a new topic Session belongs to; the Host picks it so
             the browser never has to ask which Workspace to use. */
          workspaceId: typeof value.workspaceId === 'string' ? value.workspaceId : snapshot.workspaceId,
          error: typeof value.error === 'string' ? value.error : fallbackError ?? null,
        })
      }

      const request = async (path, body) => {
        const init = body === undefined
          ? { headers: { accept: 'application/json' } }
          : { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) }
        const response = await fetch(path, init)
        if (!response.ok) throw new Error(`${path} answered ${response.status}`)
        const value = await response.json()
        adopt(value)
        if (typeof value.error === 'string') throw new Error(value.error)
        return value
      }

      const refresh = () => {
        if (inflight !== null) return inflight
        inflight = request('api/topics.state')
          .catch((error) => {
            publish({ ...snapshot, status: 'error', error: String(error?.message ?? error) })
          })
          .finally(() => {
            inflight = null
          })
        return inflight
      }

      return {
        get: () => snapshot,
        subscribe: (listener) => {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        refresh,
        create: (title) => request('api/topics.create', { title }),
        rename: (id, title) => request('api/topics.rename', { id, title }),
        update: (id, prompt) => request('api/topics.update', { id, prompt }),
        remove: (id) => request('api/topics.delete', { id }),
        createSession: (id) => request('api/topics.session', { id }),
        bind: (sessionId, topicId) => request('api/topics.bind', { sessionId, topicId }),
        moveTopic: (id, before) => request('api/topics.move', { kind: 'topic', id, before }),
        moveSession: (sessionId, topicId, before) => request('api/topics.move', { kind: 'session', sessionId, topicId, before }),
      }
    }

    /**
     * Subscribe one component to the store.
     * @param store - topic store.
     * @returns the current snapshot.
     */
    function useSnapshot(store) {
      const [snapshot, setSnapshot] = React.useState(store.get)
      React.useEffect(() => store.subscribe(() => setSnapshot(store.get())), [store])
      return snapshot
    }

    /** Insert this package's stylesheet once; returns its disposer. */
    function installStyles() {
      if (document.querySelector(`style[${CSS_MARK}]`) !== null) return () => undefined
      const style = document.createElement('style')
      style.setAttribute(CSS_MARK, '')
      style.textContent = CSS
      document.head.append(style)
      return () => style.remove()
    }

    /** The four strokes of the hash mark, as SVG path data. */
    const HASH_PATHS = ['M9.2 4.5 7.6 19.5', 'M16.4 4.5 14.8 19.5', 'M4.5 9h15', 'M3.8 15h15']

    /**
     * The hash mark as a detached SVG element.
     *
     * The header button is plain DOM appended beside React's own children, so it
     * needs a real node: a React element passed to `append()` would be
     * stringified to "[object Object]".
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function hashIconElement(size) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', String(size))
      svg.setAttribute('height', String(size))
      svg.setAttribute('viewBox', '0 0 24 24')
      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('fill', 'none')
      svg.setAttribute('stroke', 'currentColor')
      svg.setAttribute('stroke-width', '1.7')
      svg.setAttribute('stroke-linecap', 'round')
      svg.setAttribute('stroke-linejoin', 'round')
      svg.style.display = 'block'
      for (const d of HASH_PATHS) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', d)
        svg.append(path)
      }
      return svg
    }

    /** The hash mark, shared by the panel rows and the Session-row mark. */
    function HashIcon({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
        strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block' },
      }, ...HASH_PATHS.map((d, index) => h('path', { key: index, d })))
    }

    /**
     * The one-name dialog, in plain DOM so the header button and the page can
     * open the same surface.
     * @param t - locale translator for this namespace.
     * @returns `open` and `close`.
     */
    function createNameDialog(t) {
      let scrim = null
      let input = null
      let errorEl = null
      let confirmEl = null
      let confirmLabel = ''
      let submitHandler = null
      let busy = false

      const close = () => {
        if (scrim === null) return
        document.removeEventListener('keydown', onKey, true)
        scrim.remove()
        scrim = null
        input = null
        errorEl = null
        confirmEl = null
        submitHandler = null
        busy = false
      }

      const showError = (message) => {
        if (errorEl === null) return
        errorEl.textContent = message
        errorEl.hidden = false
      }

      const run = async () => {
        if (busy || submitHandler === null || input === null) return
        const name = input.value.trim()
        if (name === '') {
          showError(t('nameRequired'))
          input.focus()
          return
        }
        busy = true
        if (confirmEl !== null) {
          confirmEl.disabled = true
          confirmEl.textContent = t('saving')
        }
        if (errorEl !== null) errorEl.hidden = true
        try {
          await submitHandler(name)
          close()
        } catch (error) {
          busy = false
          if (confirmEl !== null) {
            confirmEl.disabled = false
            confirmEl.textContent = confirmLabel
          }
          showError(String(error?.message ?? error))
        }
      }

      function onKey(event) {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          close()
          return
        }
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
          event.preventDefault()
          event.stopPropagation()
          void run()
        }
      }

      const open = (options) => {
        close()
        submitHandler = options.onSubmit
        confirmLabel = options.confirmLabel
        busy = false

        scrim = document.createElement('div')
        scrim.className = 'dsh-topics-scrim'
        const panel = document.createElement('div')
        panel.className = 'dsh-topics-dialog'
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-modal', 'true')
        panel.setAttribute('aria-label', options.title)

        const title = document.createElement('h2')
        title.className = 'dsh-topics-dialog-title'
        title.textContent = options.title
        const hint = document.createElement('p')
        hint.className = 'dsh-topics-dialog-hint'
        hint.textContent = t('nameLabel')

        input = document.createElement('input')
        input.className = 'dsh-topics-input'
        input.type = 'text'
        input.autocomplete = 'off'
        input.spellcheck = false
        input.placeholder = t('namePlaceholder')
        input.value = options.value ?? ''
        input.setAttribute('aria-label', t('nameLabel'))

        errorEl = document.createElement('p')
        errorEl.className = 'dsh-topics-error'
        errorEl.setAttribute('role', 'alert')
        errorEl.hidden = true

        const footer = document.createElement('div')
        footer.className = 'dsh-topics-footer'
        const cancelEl = document.createElement('button')
        cancelEl.type = 'button'
        cancelEl.className = 'dsh-topics-btn dsh-topics-btn--plain'
        cancelEl.textContent = t('cancel')
        cancelEl.addEventListener('click', close)
        confirmEl = document.createElement('button')
        confirmEl.type = 'button'
        confirmEl.className = 'dsh-topics-btn dsh-topics-btn--primary'
        confirmEl.textContent = confirmLabel
        confirmEl.addEventListener('click', () => void run())
        footer.append(cancelEl, confirmEl)

        panel.append(title, hint, input, errorEl, footer)
        scrim.append(panel)
        scrim.addEventListener('mousedown', (event) => {
          if (event.target === scrim) close()
        })
        document.body.append(scrim)
        document.addEventListener('keydown', onKey, true)
        requestAnimationFrame(() => {
          input?.focus()
          input?.select()
        })
      }

      return { open, close }
    }

    /**
     * The read-only topic sheet: what the topic is called, what it contributes
     * to a Session's prompt, and what is in it. Plain DOM for the same reason as
     * the name dialog — it is opened from a menu anchored in injected markup.
     * @param t - locale translator for this namespace.
     * @returns `open` and `close`.
     */
    function createDetailsDialog(t, store) {
      let scrim = null
      /** Leaves edit mode when the prompt box is being edited. */
      let cancelEdit = null

      const close = () => {
        if (scrim === null) return
        document.removeEventListener('keydown', onKey, true)
        scrim.remove()
        scrim = null
        cancelEdit = null
      }

      function onKey(event) {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        if (cancelEdit !== null) cancelEdit()
        else close()
      }

      const open = (topic) => {
        close()
        scrim = document.createElement('div')
        scrim.className = 'dsh-topics-scrim'
        const panel = document.createElement('div')
        panel.className = 'dsh-topics-dialog dsh-topics-dialog--details'
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-modal', 'true')
        panel.setAttribute('aria-label', t('detailsTitle'))

        const title = document.createElement('h2')
        title.className = 'dsh-topics-dialog-title'
        title.textContent = t('detailsTitle')

        const body = document.createElement('div')
        body.className = 'dsh-topics-details'
        const row = (key, value) => {
          const line = document.createElement('div')
          line.className = 'dsh-topics-detailRow'
          const keyEl = document.createElement('span')
          keyEl.className = 'dsh-topics-detailKey'
          keyEl.textContent = key
          const valueEl = document.createElement('span')
          valueEl.className = 'dsh-topics-detailValue'
          valueEl.textContent = value
          line.append(keyEl, valueEl)
          return line
        }
        body.append(row(t('details'), topic.title))
        const created = typeof topic.createdAt === 'string' ? new Date(topic.createdAt) : null
        if (created !== null && !Number.isNaN(created.getTime())) {
          body.append(row(t('detailsCreated'), created.toLocaleString()))
        }
        const sessions = Array.isArray(topic.sessions) ? topic.sessions : []
        body.append(row(t('detailsSessions'), sessions.length === 0
          ? t('detailsNoSessions')
          : sessions.map((session) => session.title === '' ? t('group.untitled') : session.title).join('、')))

        const promptLabel = document.createElement('div')
        promptLabel.className = 'dsh-topics-detailRow'
        const promptKey = document.createElement('span')
        promptKey.className = 'dsh-topics-detailKey'
        promptKey.style.width = 'auto'
        promptKey.textContent = t('detailsPrompt')
        promptLabel.append(promptKey)

        /* One box: a preview of the injected section, switched in place to an
           editor for the topic's own prompt text by the pencil. */
        const box = document.createElement('div')
        box.className = 'dsh-topics-promptBox'
        const prompt = document.createElement('pre')
        prompt.className = 'dsh-topics-prompt'
        /* The Host sends the assembled section; derive it when an older Host is
           still running, so the sheet is never blank. */
        const showRendered = (value) => {
          prompt.textContent = typeof value.rendered === 'string' && value.rendered !== ''
            ? value.rendered
            : `# Topic: ${value.title}\n\nThis Session belongs to the "${value.title}" topic.`
        }
        let current = topic
        showRendered(current)
        const editEl = document.createElement('button')
        editEl.type = 'button'
        editEl.className = 'dsh-topics-iconButton dsh-topics-promptEdit'
        editEl.title = t('detailsEditAria')
        editEl.setAttribute('aria-label', t('detailsEditAria'))
        editEl.append(editElement(14))

        const editor = document.createElement('textarea')
        editor.className = 'dsh-topics-input'
        editor.style.height = '140px'
        editor.style.marginTop = '0'
        editor.style.resize = 'vertical'
        editor.spellcheck = false
        editor.placeholder = t('detailsEditPlaceholder')
        const status = document.createElement('p')
        status.className = 'dsh-topics-error'
        status.setAttribute('role', 'alert')
        const actions = document.createElement('div')
        actions.className = 'dsh-topics-promptActions'
        const cancelEl = document.createElement('button')
        cancelEl.type = 'button'
        cancelEl.className = 'dsh-topics-btn dsh-topics-btn--plain dsh-topics-btn--sm'
        cancelEl.textContent = t('cancel')
        const saveEl = document.createElement('button')
        saveEl.type = 'button'
        saveEl.className = 'dsh-topics-btn dsh-topics-btn--primary dsh-topics-btn--sm'
        saveEl.textContent = t('detailsSave')
        actions.append(cancelEl, saveEl)

        const setEditing = (editing) => {
          prompt.hidden = editing
          editEl.hidden = editing
          editor.hidden = !editing
          actions.hidden = !editing
          status.hidden = true
          cancelEdit = editing ? () => setEditing(false) : null
          if (editing) {
            /* What you see is what is injected: edit the effective text itself. */
            editor.value = prompt.textContent
            requestAnimationFrame(() => editor.focus())
          }
        }
        setEditing(false)
        editEl.addEventListener('click', () => setEditing(true))
        cancelEl.addEventListener('click', () => setEditing(false))
        saveEl.addEventListener('click', async () => {
          if (saveEl.disabled) return
          saveEl.disabled = true
          saveEl.textContent = t('detailsSaving')
          status.hidden = true
          try {
            const value = await store.update(topic.id, editor.value)
            const next = Array.isArray(value?.topics) ? value.topics.find((item) => item.id === topic.id) : undefined
            if (next !== undefined) current = next
            showRendered(current)
            setEditing(false)
          } catch (error) {
            status.textContent = String(error?.message ?? error)
            status.hidden = false
          } finally {
            saveEl.disabled = false
            saveEl.textContent = t('detailsSave')
          }
        })
        box.append(prompt, editEl, editor, status, actions)
        body.append(promptLabel, box)

        const footer = document.createElement('div')
        footer.className = 'dsh-topics-footer'
        const closeEl = document.createElement('button')
        closeEl.type = 'button'
        closeEl.className = 'dsh-topics-btn dsh-topics-btn--primary'
        closeEl.textContent = t('close')
        closeEl.addEventListener('click', close)
        footer.append(closeEl)

        panel.append(title, body, footer)
        scrim.append(panel)
        scrim.addEventListener('mousedown', (event) => {
          if (event.target === scrim) close()
        })
        document.body.append(scrim)
        document.addEventListener('keydown', onKey, true)
        requestAnimationFrame(() => closeEl.focus())
      }

      return { open, close }
    }

    /** True when one element carries a module class whose semantic name is `name`. */
    const hasClassNamed = (element, name) => [...element.classList].some((token) => token.endsWith(`_${name}`))

    /**
     * Mount the "#" button into the workspace section header.
     *
     * The header is hardcoded inside the shipped browser, so this is the one
     * DOM-level touch in the package: locate the header through its slot
     * outlet, keep the button inside the shipped action group, and let a
     * MutationObserver restore it whenever React reconciles that row. The group
     * caps its own width, so the mount also publishes the one attribute the
     * stylesheet needs to widen it while the search field is collapsed.
     * @param options - accessible label and click handler.
     * @returns the disposer.
     */
    function mountHeaderButton(options) {
      let button = null
      let group = null
      let frame = 0
      let disposed = false

      const findHeader = () => {
        for (const outlet of document.querySelectorAll('[data-slot="sidebar.workspaces"]')) {
          for (const root of outlet.children) {
            if (root.nodeType !== 1) continue
            /* The browser root's first element child is the section header; its
               action group is a cell of that row in both layouts (the rail
               renders the group with the add-workspace button only). */
            const header = root.firstElementChild
            if (header === null) continue
            for (const child of header.children) {
              if (child.nodeType === 1 && hasClassNamed(child, 'headerActions')) {
                return { root, group: child }
              }
            }
          }
        }
        return null
      }

      const ensure = () => {
        if (disposed) return
        const found = findHeader()
        if (found === null) {
          if (button !== null) button.remove()
          button = null
          return
        }
        if (button === null) {
          button = document.createElement('button')
          button.type = 'button'
          button.className = 'dsh-topics-add'
          button.setAttribute('aria-label', options.label)
          button.title = options.label
          button.append(hashIconElement(16))
          button.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            options.onActivate()
          })
        }
        group = found.group
        if (button.parentNode !== found.group) found.group.append(button)
        const rail = hasClassNamed(found.root, 'rail')
        button.dataset.rail = rail ? '1' : '0'
        const icon = button.firstElementChild
        if (icon !== null) {
          icon.setAttribute('width', rail ? '18' : '16')
          icon.setAttribute('height', rail ? '18' : '16')
        }
        /* The shipped group caps its own width to the two buttons it knows
           about, so a third one would be clipped. React owns that element's
           class list and rewrites it whenever the search field expands, but it
           has no style prop there, so an inline cap survives reconciliation and
           still animates through the shipped max-width transition. Rail mode
           already sizes the group to its content, so it needs no cap. */
        found.group.style.maxWidth = rail
          ? ''
          : hasClassNamed(found.group, 'headerActionsHidden') ? '0px' : '92px'
      }

      const schedule = () => {
        if (disposed || frame !== 0) return
        frame = requestAnimationFrame(() => {
          frame = 0
          ensure()
        })
      }

      /* React rewrites the action group's class list when the search field
         expands or collapses, which changes nothing in the child list, so the
         observer also watches that one attribute and filters to the header's own
         elements rather than reacting to every class change in the document. */
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'childList') return schedule()
          /* Only the three elements whose state this mount depends on matter:
             the action group (its hidden/collapsed class), the header, and the
             browser root (whose rail class switches layouts). */
          const target = record.target
          if (target === group || target === group?.parentNode || target === group?.parentNode?.parentNode) return schedule()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
      ensure()

      return () => {
        disposed = true
        observer.disconnect()
        if (frame !== 0) cancelAnimationFrame(frame)
        button?.remove()
        button = null
        /* Hand the group back exactly as React expects to find it. */
        if (group !== null) group.style.maxWidth = ''
        group = null
      }
    }

    /**
     * A detached icon from the shipped 16x16 set.
     *
     * These rows are plain DOM beside React's, so every mark is a real node;
     * the geometry and path data copy the primitives package the shipped rows
     * use, so an injected row is indistinguishable from a rendered one.
     * @param size - square edge in pixels.
     * @param viewBox - the icon's own coordinate box.
     * @param paths - `d` plus per-path attributes.
     * @param root - attributes for the `<svg>` itself.
     * @returns the SVG element.
     */
    function iconElement(size, viewBox, paths, root = {}) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', String(size))
      svg.setAttribute('height', String(size))
      svg.setAttribute('viewBox', viewBox)
      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('fill', root.fill ?? 'none')
      if (root.stroke !== false) svg.setAttribute('stroke', 'currentColor')
      if (root['stroke-width'] !== undefined) svg.setAttribute('stroke-width', root['stroke-width'])
      if (root.class !== undefined) svg.setAttribute('class', root.class)
      svg.style.display = 'block'
      for (const path of paths) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        node.setAttribute('d', path.d)
        if (path.fill !== undefined) node.setAttribute('fill', path.fill)
        if (path.stroke !== undefined) node.setAttribute('stroke', path.stroke)
        svg.append(node)
      }
      return svg
    }

    /**
     * The shipped expander triangle (`IconTriangleRightFillRegular`, 16x16):
     * a filled right-pointing triangle that CSS rotates when the row is open.
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function chevronElement(size) {
      return iconElement(size, '0 0 16 16', [{
        d: 'M5.5 4.5C5.5 4.40714 5.52586 4.31612 5.57467 4.23713C5.62349 4.15815 5.69334 4.09431 5.77639 4.05279C5.85945 4.01126 5.95242 3.99368 6.0449 4.00202C6.13738 4.01036 6.22572 4.04429 6.3 4.1L10.967 7.6C11.0291 7.64657 11.0795 7.70697 11.1142 7.77639C11.1489 7.84582 11.167 7.92238 11.167 8C11.167 8.07762 11.1489 8.15418 11.1142 8.22361C11.0795 8.29303 11.0291 8.35343 10.967 8.4L6.3 11.9C6.22572 11.9557 6.13738 11.9896 6.0449 11.998C5.95242 12.0063 5.85945 11.9887 5.77639 11.9472C5.69334 11.9057 5.62349 11.8419 5.57467 11.7629C5.52586 11.6839 5.5 11.5929 5.5 11.5V4.5Z',
        fill: 'currentColor',
        stroke: 'none',
      }], { fill: 'currentColor', stroke: false })
    }

    /**
     * The shipped `+` for a group row (`IconNewChatOutlineRegular`, 16x16).
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function plusElement(size) {
      return iconElement(size, '0 0 16 16', [
        { d: 'M2.37091 11.2501C1.58745 9.89288 1.32067 8.29835 1.61969 6.76006C1.91872 5.22177 2.76342 3.8433 3.99826 2.87846C5.2331 1.91362 6.77494 1.42737 8.33988 1.50925C9.90482 1.59113 11.3875 2.23562 12.5149 3.32406C13.6425 4.41269 14.3387 5.87206 14.4754 7.4334C14.612 8.99474 14.18 10.5529 13.2587 11.8209C12.3375 13.0888 10.9891 13.9813 9.46194 14.3337C8.18691 14.628 6.85895 14.5294 5.64989 14.0605C5.1712 13.8748 4.76962 13.4932 4.26534 13.3967C3.67413 13.2835 2.95257 13.5598 2.03794 14.3337', stroke: 'currentColor' },
        { d: 'M8 5V11', stroke: 'currentColor' },
        { d: 'M5 8H11', stroke: 'currentColor' },
      ], { fill: 'none', 'stroke-width': '1' })
    }

    /**
     * The shipped ellipsis (`IconEllipsisOutlineRegular`, 16x16): three dots,
     * the anchor of a row menu.
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function ellipsisElement(size) {
      return iconElement(size, '0 0 16 16', [
        { d: 'M3 9C3.55228 9 4 8.55228 4 8C4 7.44772 3.55228 7 3 7C2.44772 7 2 7.44772 2 8C2 8.55228 2.44772 9 3 9Z', fill: 'currentColor', stroke: 'none' },
        { d: 'M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z', fill: 'currentColor', stroke: 'none' },
        { d: 'M13 9C13.5523 9 14 8.55228 14 8C14 7.44772 13.5523 7 13 7C12.4477 7 12 7.44772 12 8C12 8.55228 12.4477 9 13 9Z', fill: 'currentColor', stroke: 'none' },
      ], { fill: 'currentColor', stroke: false })
    }

    /**
     * The shipped edit icon (`IconEditOutlineRegular`, 16x16).
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function editElement(size) {
      return iconElement(size, '0 0 16 16', [
        { d: 'M8.85596 2.69971H4.19971C3.37141 2.69971 2.69992 3.37146 2.69971 4.19971V11.8003C2.69992 12.6285 3.37141 13.3003 4.19971 13.3003H11.8003C12.6283 13.2999 13.3001 12.6283 13.3003 11.8003V7.89893H14.3003V11.8003C14.3001 13.1806 13.1806 14.2999 11.8003 14.3003H4.19971C2.81913 14.3003 1.69992 13.1808 1.69971 11.8003V4.19971C1.69992 2.81918 2.81913 1.69971 4.19971 1.69971H8.85596V2.69971Z', fill: 'currentColor', stroke: 'none' },
        { d: 'M7.7849 8.23878L13.888 2.13574', stroke: 'currentColor' },
      ], { fill: 'none', 'stroke-width': '1' })
    }

    /**
     * The shipped pin icon (`IconPinOutlineRegular`, 16x16).
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function pinOutlineElement(size) {
      return iconElement(size, '0 0 16 16', [
        { d: 'M9.96976 1.70572L13.1554 3.93629L10.9019 8.12317L11.5158 11.605L10.7192 12.7427L2.52767 7.00693L3.3243 5.86922L6.80612 5.25528L9.96976 1.70572Z', stroke: 'currentColor' },
        { d: 'M6.05285 9.47511C6.27284 9.16094 6.70586 9.08458 7.02003 9.30457C7.3342 9.52455 7.41055 9.95757 7.19057 10.2717L3.98587 14.4708L3.21223 13.9291L6.05285 9.47511Z', fill: 'currentColor', stroke: 'none' },
      ], { fill: 'none', 'stroke-width': '1' })
    }

    /**
     * The shipped filled pin icon (`IconPinFillRegular`, 16x16).
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function pinFillElement(size) {
      return iconElement(size, '0 0 16 16', [
        { d: 'M9.96976 1.70572L13.1554 3.93629L10.9019 8.12317L11.5158 11.605L10.7192 12.7427L2.52767 7.00693L3.3243 5.86922L6.80612 5.25528L9.96976 1.70572Z', fill: 'currentColor', stroke: 'currentColor' },
        { d: 'M6.05285 9.47511C6.27284 9.16094 6.70586 9.08458 7.02003 9.30457C7.3342 9.52455 7.41055 9.95757 7.19057 10.2717L3.98587 14.4708L3.21223 13.9291L6.05285 9.47511Z', fill: 'currentColor', stroke: 'none' },
      ], { fill: 'none', 'stroke-width': '1' })
    }

    /**
     * The shipped archive icon (`IconArchiveOutlineRegular`, 16x16).
     * @param size - square edge in pixels.
     * @returns the SVG element.
     */
    function archiveElement(size) {
      return iconElement(size, '0 0 16 16', [
        { d: 'M13.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V4.5C1.5 5.05228 1.94772 5.5 2.5 5.5H13.5C14.0523 5.5 14.5 5.05228 14.5 4.5V3.5C14.5 2.94772 14.0523 2.5 13.5 2.5Z', stroke: 'currentColor' },
        { d: 'M2.5 5.5V13.5C2.5 13.7652 2.60536 14.0196 2.79289 14.2071C2.98043 14.3946 3.23478 14.5 3.5 14.5H12.5C12.7652 14.5 13.0196 14.3946 13.2071 14.2071C13.3946 14.0196 13.5 13.7652 13.5 13.5V5.5', stroke: 'currentColor' },
        { d: 'M6.5 9.5H9.5', stroke: 'currentColor' },
      ], { fill: 'none', 'stroke-width': '1' })
    }

    /**
     * Render every topic as its own sidebar group, a peer of the shipped
     * workspace groups.
     *
     * The sidebar exposes no slot at group level — the shipped browser
     * hardcodes its own sections — so these groups are built as plain DOM at
     * the head of the same list, above the shipped sections: a topic that was
     * just named has to be visible without scrolling past every workspace. Two rules keep
     * that safe: our rows carry `data-dsh-topics-row` rather than
     * `data-row-key`, because the shipped row animation reads every
     * `data-row-key` in the list and would treat unknown keys as rows that just
     * left, cloning them into its exit overlay; and the container is only
     * touched when our own signature changes or React moved the wrapper, so the
     * observer cannot feed itself.
     * @param options - store, translator, and the two Session actions.
     * @returns the disposer.
     */
    function mountTopicGroups(options) {
      const { store, t } = options
      let wrapper = null
      let list = null
      let frame = 0
      let disposed = false
      let signature = ''
      const collapsed = new Set()

      const findList = () => {
        for (const outlet of document.querySelectorAll('[data-slot="sidebar.workspaces"]')) {
          for (const node of outlet.querySelectorAll('[role="tree"]')) {
            if (hasClassNamed(node, 'list')) return node
          }
        }
        return null
      }

      /* The Host may be a version that predates the `sessions` view: derive the
         members from `sessionIds` so a stale Host still renders groups instead of
         throwing. Titles arrive once the Host is current. */
      const membersOf = (topic) => {
        if (Array.isArray(topic.sessions)) return topic.sessions
        const ids = Array.isArray(topic.sessionIds) ? topic.sessionIds : []
        return ids.map((sessionId) => ({ sessionId, title: '' }))
      }

      /* One row menu: the two things a topic has, in the shipped popover
         surface. It is rebuilt per open because the anchor is a row that a
         rebuild may replace. */
      let popover = null
      let menuRow = null
      const closePopover = () => {
        if (menuRow !== null) menuRow.removeAttribute('data-menu')
        menuRow = null
        if (popover === null) return
        document.removeEventListener('pointerdown', onPopoverPointer, true)
        document.removeEventListener('keydown', onPopoverKey, true)
        popover.remove()
        popover = null
      }
      function onPopoverKey(event) {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        closePopover()
      }
      function onPopoverPointer(event) {
        if (popover !== null && !popover.contains(event.target)) closePopover()
      }
      const openPopover = (anchor, topic) => {
        closePopover()
        const surface = document.createElement('div')
        surface.className = 'dsh-topics-popover'
        surface.setAttribute('role', 'menu')
        surface.setAttribute('aria-label', topic.title)
        const addRow = (label, danger, run) => {
          const row = document.createElement('button')
          row.type = 'button'
          row.className = 'dsh-topics-popover-row'
          row.setAttribute('role', 'menuitem')
          if (danger) row.setAttribute('data-danger', '1')
          row.textContent = label
          row.addEventListener('click', () => {
            closePopover()
            run()
          })
          surface.append(row)
        }
        addRow(t('details'), false, () => options.details(topic))
        addRow(t('rename'), false, () => options.rename(topic))
        addRow(t('delete'), true, () => options.remove(topic))
        menuRow = anchor.closest('.dsh-topics-projectRow')
        if (menuRow !== null) menuRow.setAttribute('data-menu', '1')
        document.body.append(surface)
        const rect = anchor.getBoundingClientRect()
        const width = surface.offsetWidth
        surface.style.top = `${Math.round(rect.bottom + 4)}px`
        surface.style.left = `${Math.round(Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)))}px`
        popover = surface
        document.addEventListener('pointerdown', onPopoverPointer, true)
        document.addEventListener('keydown', onPopoverKey, true)
      }

      /* Drag state for reordering. Topics and Sessions share one record; a drop
         asks the Host to write the new order, and the rebuild that follows the
         response is what makes the order durable on screen. */
      let drag = null
      const clearDropMarks = () => {
        if (wrapper === null) return
        for (const node of wrapper.querySelectorAll('[data-drop]')) node.removeAttribute('data-drop')
      }
      const halfOf = (event, element) => {
        const rect = element.getBoundingClientRect()
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      }
      const commitTopicDrop = (section, half) => {
        if (drag === null || drag.kind !== 'topic') return
        const sections = [...wrapper.querySelectorAll('.dsh-topics-group')]
        const index = sections.indexOf(section)
        const neighbour = half === 'before' ? sections[index] : sections[index + 1]
        const before = neighbour?.getAttribute('data-dsh-topics-topic') ?? undefined
        if (before === drag.id) return
        void store.moveTopic(drag.id, before)
      }
      const commitSessionDrop = (topicId, sessionRow, half) => {
        if (drag === null || drag.kind !== 'session') return
        let before
        if (sessionRow !== undefined) {
          const rows = [...sessionRow.parentNode.querySelectorAll('.dsh-topics-sessionRow')]
          const index = rows.indexOf(sessionRow)
          const neighbour = half === 'before' ? rows[index] : rows[index + 1]
          before = neighbour?.getAttribute('data-dsh-topics-session') ?? undefined
        }
        void store.moveSession(drag.id, topicId, before)
      }

      /* The shipped sidebar treats a blank Session as a reusable placeholder: it
         shows that row only while the blank Session is the selected one, so
         walking away from a fresh conversation clears its row instead of leaving
         an undeletable "未命名会话" behind. Topics follow the same rule. */
      const sessionState = () => {
        try {
          return options.sessions?.list?.getSnapshot?.()
        } catch {
          return undefined
        }
      }
      const blankSessions = () => {
        const state = sessionState()
        if (state === undefined) return []
        return Object.keys(state.byId ?? {}).filter((id) => state.byId[id]?.blank === true).sort()
      }
      const currentSessionId = () => {
        for (const outlet of document.querySelectorAll('[data-slot="sidebar.workspaces"]')) {
          for (const row of outlet.querySelectorAll('[data-row-key][aria-selected="true"]')) {
            const key = row.getAttribute('data-row-key') ?? ''
            if (key.startsWith('session:')) return key.slice('session:'.length)
          }
        }
        return undefined
      }
      const visibleMembers = (topic) => {
        const rows = membersOf(topic)
        const state = sessionState()
        const byId = state?.byId ?? {}
        const current = currentSessionId()
        return rows.filter((session) => {
          if (options.isArchived(session.sessionId)) return false
          const summary = byId[session.sessionId]
          if (summary === undefined) return true
          return summary.blank !== true || session.sessionId === current
        })
      }

      const build = () => {
        const snapshot = store.get()
        for (const root of reactRoots.splice(0)) {
          try { root.unmount() } catch { /* already gone */ }
        }
        const wrap = document.createElement('div')
        wrap.className = 'dsh-topics-groups'
        for (const topic of snapshot.topics) {
          const open = !collapsed.has(topic.id)
          const section = document.createElement('div')
          section.className = 'dsh-topics-group'
          section.setAttribute('data-dsh-topics-topic', topic.id)

          /* The shipped group row: a leading 16x20 slot pair, a title, then the
             hover actions. The mark and the expander share the first slot — the
             mark at rest, the triangle while hovered — exactly like the shipped
             row swaps its folder for a chevron. */
          const row = document.createElement('div')
          row.className = 'dsh-topics-projectRow'
          row.setAttribute('data-dsh-topics-row', `topic:${topic.id}`)
          row.setAttribute('role', 'treeitem')
          row.setAttribute('aria-expanded', open ? 'true' : 'false')
          row.setAttribute('data-open', open ? '1' : '0')
          row.tabIndex = 0
          row.draggable = true

          const mark = document.createElement('span')
          mark.className = 'dsh-topics-mark'
          mark.append(hashIconElement(16))
          const chevron = document.createElement('span')
          chevron.className = 'dsh-topics-chevron'
          chevron.append(chevronElement(14))
          const chevronSvg = chevron.firstElementChild
          if (chevronSvg !== null) chevronSvg.setAttribute('class', 'dsh-topics-arrow')

          const text = document.createElement('span')
          text.className = 'dsh-topics-projectText'
          const title = document.createElement('span')
          title.className = 'dsh-topics-title'
          title.textContent = topic.title
          text.append(title)

          const actions = document.createElement('span')
          actions.className = 'dsh-topics-rowActions'
          const menuButton = document.createElement('button')
          menuButton.type = 'button'
          menuButton.className = 'dsh-topics-iconButton'
          menuButton.title = t('actions.aria')
          menuButton.setAttribute('aria-label', `${t('actions.aria')} ${topic.title}`)
          menuButton.setAttribute('aria-haspopup', 'menu')
          menuButton.append(ellipsisElement(16))
          menuButton.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            row.setAttribute('data-menu', '1')
            openPopover(menuButton, topic)
          })
          const addButton = document.createElement('button')
          addButton.type = 'button'
          addButton.className = 'dsh-topics-iconButton'
          addButton.title = t('group.newSession')
          addButton.setAttribute('aria-label', `${t('group.newSession')} ${topic.title}`)
          addButton.append(plusElement(16))
          addButton.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            options.newSession(topic.id)
          })
          actions.append(menuButton, addButton)

          const toggle = () => {
            if (collapsed.has(topic.id)) collapsed.delete(topic.id)
            else collapsed.add(topic.id)
            signature = ''
            ensure()
          }
          row.addEventListener('click', toggle)
          row.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            toggle()
          })
          row.addEventListener('dragstart', (event) => {
            drag = { kind: 'topic', id: topic.id }
            event.dataTransfer?.setData('text/plain', topic.id)
            if (event.dataTransfer !== undefined && event.dataTransfer !== null) event.dataTransfer.effectAllowed = 'move'
          })
          row.addEventListener('dragend', () => {
            drag = null
            clearDropMarks()
          })
          row.addEventListener('dragover', (event) => {
            if (drag === null) return
            event.preventDefault()
            if (drag.kind === 'topic') {
              clearDropMarks()
              section.setAttribute('data-drop', halfOf(event, row))
            } else {
              section.setAttribute('data-drop', 'after')
            }
          })
          row.addEventListener('drop', (event) => {
            if (drag === null) return
            event.preventDefault()
            event.stopPropagation()
            clearDropMarks()
            if (drag.kind === 'topic') {
              commitTopicDrop(section, halfOf(event, row))
            } else {
              /* Dropping a Session on a group row appends it to that topic. */
              commitSessionDrop(topic.id, undefined)
            }
          })

          row.append(mark, chevron, text, actions)
          section.append(row)

          if (open) {
            const sessions = visibleMembers(topic)
            if (sessions.length === 0) {
              /* An empty topic is a normal state: it is a place to collect
                 Sessions, not a Session that has not started yet. It is also a
                 drop target, so a Session can be dragged into it. */
              const empty = document.createElement('div')
              empty.className = 'dsh-topics-groupEmpty'
              empty.textContent = t('group.empty')
              empty.addEventListener('dragover', (event) => {
                if (drag === null) return
                event.preventDefault()
                clearDropMarks()
                section.setAttribute('data-drop', 'after')
              })
              empty.addEventListener('drop', (event) => {
                if (drag === null) return
                event.preventDefault()
                clearDropMarks()
                commitSessionDrop(topic.id, undefined)
              })
              section.append(empty)
            } else {
              for (const session of sessions) {
                const sessionRow = document.createElement('div')
                sessionRow.className = 'dsh-topics-sessionRow'
                sessionRow.setAttribute('data-dsh-topics-row', `session:${session.sessionId}`)
                sessionRow.setAttribute('data-dsh-topics-session', session.sessionId)
                sessionRow.setAttribute('role', 'treeitem')
                sessionRow.tabIndex = 0
                sessionRow.draggable = true
                /* Native Session rows lead with a status cell, never a mark: the
                   group already says which topic this Session belongs to. */
                const slot = document.createElement('span')
                slot.className = 'dsh-topics-sessionSlot'
                /* Copy the shipped state cell verbatim: the same dot, the same
                   spinner, driven by the same stylesheet. The shipped slot also
                   carries our own "#" mark (see SessionTopicMark); strip it from
                   the copy, because the group already says which topic this
                   Session belongs to. */
                const statusCell = nativeRows.get(session.sessionId)?.firstElementChild ?? fallbackStatus
                if (statusCell !== null && statusCell !== undefined) {
                  const copy = statusCell.cloneNode(true)
                  for (const mark of copy.querySelectorAll('.dsh-topics-mark')) mark.remove()
                  slot.append(copy)
                }
                const sessionTitle = document.createElement('span')
                sessionTitle.className = 'dsh-topics-sessionTitle'
                const summary = sessionState()?.byId?.[session.sessionId]
                if (summary?.blank === true) {
                  sessionTitle.textContent = t('row.new')
                } else {
                  /* Same sources, same order as the shipped row: the Session
                     catalog's durable title, then the label the sidebar painted,
                     then the Host projection, then the untitled fallback. */
                  const catalog = typeof summary?.title === 'string' ? summary.title.trim() : ''
                  sessionTitle.textContent = catalog !== ''
                    ? catalog
                    : nativeTitles.get(session.sessionId)
                      ?? (session.title === '' ? t('group.untitled') : session.title)
                }
                sessionTitle.addEventListener('dblclick', (event) => {
                  if (isBlank) return
                  event.stopPropagation()
                  const nativeRow = nativeRows.get(session.sessionId)
                  const nativeTitle = nativeRow?.querySelector?.('[class*="title"]')
                  if (nativeTitle) {
                    nativeTitle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
                  } else {
                    options.renameSession(session)
                  }
                })
                /* The shipped row highlights the selected Session; a topic row is
                   the same Session, so it carries the same selected surface. */
                if (session.sessionId === currentSessionId()) sessionRow.setAttribute('data-selected', '1')
                sessionRow.append(slot, sessionTitle)
                const isPinned = options.isPinned(session.sessionId)
                const isArchived = options.isArchived(session.sessionId)
                const isBlank = summary?.blank === true

                /* Same trailing order as the shipped row: relative time, then the
                   rest-state pin marker, then hover actions (… / archive / pin). */
                const shipped = nativeRows.get(session.sessionId)
                const timeEl = shipped === undefined
                  ? undefined
                  : [...shipped.children].find((node) => hasClassNamed(node, 'time'))
                if (timeEl !== undefined) sessionRow.append(timeEl.cloneNode(true))

                if (isPinned && !isArchived) {
                  const pinBadge = document.createElement('span')
                  pinBadge.className = 'dsh-topics-pinIndicator'
                  pinBadge.setAttribute('role', 'img')
                  pinBadge.title = t('actions.pin')
                  pinBadge.setAttribute('aria-label', t('actions.pin'))
                  pinBadge.append(pinFillElement(14))
                  sessionRow.append(pinBadge)
                }

                if (!isBlank) {
                  /* Keep dsh-topics-* action classes: the shipped rowActions
                     hover rules key off the workspace sessionRow hash, which
                     this peer row does not carry. Visual tokens already match. */
                  const host = document.createElement('span')
                  host.style.display = 'contents'
                  sessionRow.append(host)
                  const menuApi = {}
                  const root = createRoot(host)
                  reactRoots.push(root)
                  root.render(h(TopicSessionActions, {
                    session,
                    topic,
                    title: sessionTitle.textContent,
                    isPinned,
                    isArchived,
                    iconButtonClass: 'dsh-topics-iconButton',
                    rowActionsClass: 'dsh-topics-rowActions',
                    options,
                    t,
                    store: options.store,
                    rowEl: sessionRow,
                    menuApi,
                  }))
                  sessionRow.addEventListener('contextmenu', (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    menuApi.open?.()
                  })
                }

                section.append(sessionRow)
              }
            }
          }
          wrap.append(section)
        }
        return wrap
      }

      /* A Session bound to a topic is listed under that topic and nowhere else:
         the shipped workspace groups would otherwise show the same Session
         twice, and a topic Session that "jumps" into a workspace group reads as
         a bug. The override is an inline display on the shipped row, re-applied
         after every rebuild because React owns the row's classes but not its
         style. */
      const hidden = new Set()
      /* Row labels as the shipped sidebar itself renders them. A bound row is
         hidden, not removed, so its label can still be mirrored here: that keeps
         the topic row's title identical to what the workspace group would show,
         including a fallback title the Host projected from the first message. */
      const nativeTitles = new Map()
      /* The shipped rows themselves, kept so the topic row can show the very same
         leading state cell and trailing time: a running Session must spin here
         exactly as it does under its workspace. */
      const nativeRows = new Map()
      const reactRoots = []
      let fallbackStatus = null
      const hideBound = (snapshot) => {
        const bound = new Set()
        for (const topic of snapshot.topics) for (const sessionId of topic.sessionIds ?? []) bound.add(sessionId)
        nativeTitles.clear()
        nativeRows.clear()
        for (const outlet of document.querySelectorAll('[data-slot="sidebar.workspaces"]')) {
          for (const row of outlet.querySelectorAll('[data-row-key]')) {
            const key = row.getAttribute('data-row-key') ?? ''
            if (!key.startsWith('session:')) continue
            const sessionId = key.slice('session:'.length)
            const titleEl = [...row.querySelectorAll('*')].find((node) => hasClassNamed(node, 'title'))
            const label = titleEl?.textContent?.trim() ?? ''
            if (label !== '') nativeTitles.set(sessionId, label)
            nativeRows.set(sessionId, row)
            if (fallbackStatus === null && row.firstElementChild !== null) fallbackStatus = row.firstElementChild
            if (bound.has(sessionId)) {
              row.style.display = 'none'
              hidden.add(sessionId)
            } else if (hidden.delete(sessionId)) {
              row.style.display = ''
            }
          }
        }
      }

      const ensure = () => {
        if (disposed) return
        const found = findList()
        if (found === null) {
          wrapper?.remove()
          wrapper = null
          list = null
          signature = ''
          return
        }
        const snapshot = store.get()
        hideBound(snapshot)
        const next = JSON.stringify([
          snapshot.topics.map((topic) => [
            topic.id,
            topic.title,
            visibleMembers(topic).map((session) => [
              session.sessionId,
              session.title,
              options.isPinned(session.sessionId),
            ]),
          ]),
          [...collapsed].sort(),
          /* A blank Session becomes visible when it is selected and vanishes
             when it is not, so the selection is part of the shape of the list. */
          currentSessionId() ?? null,
          blankSessions(),
          /* The shipped row's leading cell is a live component (dot, spinner,
             status colour): rebuilding on its markup keeps our copy in step. */
          nativeRows.size === 0 ? null : [...nativeRows].map(([id, row]) => `${id}:${row.firstElementChild?.outerHTML ?? ''}`),
        ])
        if (wrapper === null || list !== found || next !== signature) {
          const fresh = build()
          if (wrapper !== null && wrapper.parentNode !== null) wrapper.replaceWith(fresh)
          else found.prepend(fresh)
          wrapper = fresh
          list = found
          signature = next
        }
        /* Topics lead the list. The shipped sections are React's children and
           React inserts each one relative to its own siblings, which can land it
           before our wrapper; moving ours back to the front keeps topics where a
           reader looks for them, and keeps them visible without scrolling past
           every workspace. */
        if (wrapper.parentNode !== found || wrapper !== found.firstElementChild) found.prepend(wrapper)
      }

      const schedule = () => {
        if (disposed || frame !== 0) return
        frame = requestAnimationFrame(() => {
          frame = 0
          ensure()
        })
      }

      /* Ignore our own edits: a rebuild replaces one wrapper with another and
         moving it to the end is our own doing, so a record whose every node is
         one of our wrappers is not news. Everything else — React adding a
         group, the sidebar switching layout, the list remounting — is. */
      const ownNode = (node) => node.nodeType === 1 && node.classList.contains('dsh-topics-groups')
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'attributes') {
            /* Selection moves, and a Session's run state repaints its cell. */
            if (record.attributeName === 'aria-selected' || record.attributeName === 'class') {
              schedule()
              return
            }
            continue
          }
          if (record.type !== 'childList') continue
          const nodes = [...(record.addedNodes ?? []), ...(record.removedNodes ?? [])]
          if (nodes.length > 0 && nodes.every(ownNode)) continue
          if (wrapper !== null && record.target !== null && wrapper.contains(record.target)) continue
          schedule()
          return
        }
      })
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected', 'class'] })

      const unsubscribe = store.subscribe(schedule)
      /* Bound Session titles live on the Host, so a cheap poll keeps the group
         labels honest after a rename made somewhere else in the app. */
      const ticker = setInterval(() => {
        void store.refresh()
      }, 20000)

      ensure()

      return () => {
        disposed = true
        unsubscribe()
        clearInterval(ticker)
        observer.disconnect()
        if (frame !== 0) cancelAnimationFrame(frame)
        for (const root of reactRoots.splice(0)) {
          try { root.unmount() } catch { /* already gone */ }
        }
        wrapper?.remove()
        wrapper = null
        list = null
        /* Hand every shipped row back with its own display value. */
        for (const outlet of document.querySelectorAll('[data-slot="sidebar.workspaces"]')) {
          for (const row of outlet.querySelectorAll('[data-row-key]')) {
            const key = row.getAttribute('data-row-key') ?? ''
            if (key.startsWith('session:') && hidden.delete(key.slice('session:'.length))) row.style.display = ''
          }
        }
      }
    }

    /** The leading "#" mark on a Session row bound to a topic. */
    function SessionTopicMark({ sessionId, store, t }) {
      const snapshot = useSnapshot(store)
      if (!snapshot.topics.some((topic) => topic.sessionIds.includes(sessionId))) return null
      return h('span', {
        className: 'dsh-topics-mark',
        title: t('mark.aria'),
        'aria-label': t('mark.aria'),
        onClick: (event) => event.stopPropagation(),
      }, h(HashIcon, { size: 13 }))
    }

    /**
     * One Session-row menu entry set: pick a topic to bind, or drop the binding.
     * Uses the shipped MenuGroup / MenuItemButton so the section heading and
     * check mark line up with every other sidebar session menu.
     * @param props - row identity, menu dismissal hook, store, and translator.
     */
    function SessionTopicMenuItem({ sessionId, useMenuOpenState, store, t }) {
      const snapshot = useSnapshot(store)
      const [, setMenuOpen] = useMenuOpenState()
      if (snapshot.topics.length === 0) return null
      const bound = snapshot.topics.find((topic) => topic.sessionIds.includes(sessionId))
      const choose = (topicId) => {
        setMenuOpen(false)
        void store.bind(sessionId, topicId)
      }
      return h(MenuGroup, { label: t('menu.bind') },
        snapshot.topics.map((topic) => h(MenuItemButton, {
          key: topic.id,
          icon: topic.id === bound?.id
            ? h(IconCheckOutlineRegular, { size: 14 })
            : h('span', {
              'aria-hidden': true,
              style: { display: 'inline-block', width: 14, height: 14 },
            }),
          onSelect: () => choose(topic.id),
        }, topic.title)),
        bound !== undefined && h(MenuItemButton, {
          danger: true,
          separatorBefore: true,
          onSelect: () => choose(undefined),
        }, t('menu.unbind')),
      )
    }

    /**
     * Hover actions + … menu for a topic-group session row. Reuses the shipped
     * Menu / Tooltip / icons so anchoring, order, and chrome match workspace rows
     * (… then archive then pin; portal Menu aligned to the ellipsis button).
     */
    function TopicSessionActions({
      session,
      topic,
      title,
      isPinned,
      isArchived,
      iconButtonClass,
      rowActionsClass,
      options,
      t,
      store,
      rowEl,
      menuApi,
    }) {
      const [menuOpen, setMenuOpen] = React.useState(false)
      React.useEffect(() => {
        if (menuApi !== undefined && menuApi !== null) {
          menuApi.open = () => setMenuOpen(true)
          menuApi.close = () => setMenuOpen(false)
        }
        return () => {
          if (menuApi !== undefined && menuApi !== null) {
            if (menuApi.open !== undefined) menuApi.open = undefined
            if (menuApi.close !== undefined) menuApi.close = undefined
          }
        }
      }, [menuApi])
      React.useEffect(() => {
        if (rowEl === undefined || rowEl === null) return
        if (menuOpen) rowEl.setAttribute('data-menu', '1')
        else rowEl.removeAttribute('data-menu')
        return () => rowEl.removeAttribute('data-menu')
      }, [menuOpen, rowEl])

      const useMenuOpenState = React.useCallback(() => [menuOpen, setMenuOpen], [menuOpen])
      const btnClass = iconButtonClass || 'dsh-topics-iconButton'
      const actionsClass = rowActionsClass || 'dsh-topics-rowActions'

      return h('span', {
        className: actionsClass,
        onClick: (event) => event.stopPropagation(),
      },
        h(Menu, {
          open: menuOpen,
          onClose: () => setMenuOpen(false),
          portal: true,
          closeOnPointerLeave: true,
          align: 'start',
          side: 'bottom',
          anchor: h('button', {
            type: 'button',
            className: btnClass,
            'aria-label': t('actions.session.aria', { name: title }),
            'aria-haspopup': 'menu',
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              setMenuOpen((v) => !v)
            },
          }, h(IconEllipsisOutlineRegular, {})),
        },
          !isArchived && h(MenuItemButton, {
            icon: isPinned ? h(IconPinFillRegular, {}) : h(IconPinOutlineRegular, {}),
            onSelect: () => {
              setMenuOpen(false)
              if (isPinned) options.unpinSession(session.sessionId)
              else options.pinSession(session.sessionId)
            },
          }, t(isPinned ? 'menu.unpinSession' : 'menu.pinSession')),
          h(MenuItemButton, {
            icon: h(IconEditOutlineRegular, {}),
            onSelect: () => {
              setMenuOpen(false)
              options.renameSession(session)
            },
          }, t('menu.renameSession')),
          h(MenuItemButton, {
            icon: h(IconBranchOutlineRegular, {}),
            onSelect: () => {
              setMenuOpen(false)
              options.forkSession(session.sessionId, topic.id)
            },
          }, t('menu.fork')),
          h(MenuItemButton, {
            icon: isArchived
              ? h(IconUnarchiveOutlineRegular, { size: 14 })
              : h(IconArchiveOutlineRegular, { size: 14 }),
            onSelect: () => {
              setMenuOpen(false)
              if (isArchived) options.unarchiveSession(session.sessionId)
              else options.archiveSession(session.sessionId)
            },
          }, t(isArchived ? 'menu.unarchiveSession' : 'menu.archiveSession')),
          h(MenuItemButton, {
            icon: h(IconCopyOutlineRegular, {}),
            onSelect: () => {
              setMenuOpen(false)
              options.copySessionId(session.sessionId)
            },
          }, t('menu.sessionId')),
          h(SessionTopicMenuItem, {
            sessionId: session.sessionId,
            useMenuOpenState,
            store,
            t,
          }),
        ),
        h(Tooltip, {
          label: t(isArchived ? 'actions.unarchive' : 'actions.archive'),
          side: 'bottom',
          align: 'end',
          delayMs: 500,
          portal: true,
        }, h('button', {
          type: 'button',
          className: btnClass,
          'aria-label': t(isArchived ? 'menu.unarchiveSession' : 'menu.archiveSession'),
          onClick: (event) => {
            event.preventDefault()
            event.stopPropagation()
            if (isArchived) options.unarchiveSession(session.sessionId)
            else options.archiveSession(session.sessionId)
          },
        }, isArchived
          ? h(IconUnarchiveOutlineRegular, { size: 14 })
          : h(IconArchiveOutlineRegular, { size: 14 }))),
        !isArchived && h(Tooltip, {
          label: t(isPinned ? 'actions.unpin' : 'actions.pin'),
          side: 'bottom',
          align: 'end',
          delayMs: 500,
          portal: true,
        }, h('button', {
          type: 'button',
          className: btnClass,
          'aria-label': t(isPinned ? 'menu.unpinSession' : 'menu.pinSession'),
          onClick: (event) => {
            event.preventDefault()
            event.stopPropagation()
            if (isPinned) options.unpinSession(session.sessionId)
            else options.pinSession(session.sessionId)
          },
        }, isPinned
          ? h(IconPinFillRegular, { size: 14 })
          : h(IconPinOutlineRegular, { size: 14 }))),
      )
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace', 'workspaces'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'topics: dictionaries')
        ctx.effect(() => installStyles(), 'topics: stylesheet')

        const t = ctx.locale.bind(NS)
        const store = createTopicStore()
        const dialog = createNameDialog(t)
        const details = createDetailsDialog(t, store)
        void store.refresh()

        ctx.effect(() => dialog.close, 'topics: dialog')
        ctx.effect(() => details.close, 'topics: details')

        /* The header "#": name a topic. A topic is created empty — it is a
           group in the sidebar, not a Session that has not been used yet. */
        ctx.effect(() => mountHeaderButton({
          label: t('addAria'),
          onActivate: () => dialog.open({
            title: t('createTitle'),
            value: '',
            confirmLabel: t('createConfirm'),
            onSubmit: (name) => store.create(name),
          }),
        }), 'topics: header button')

        const workspaces = ctx.get?.('workspaces') ?? ctx.workspaces
        const sessions = ctx.get?.('sessions') ?? ctx.sessions

        /* The sidebar has no group-level slot, so topics are rendered as peer
           groups beside the shipped workspace groups. */
        ctx.effect(() => mountTopicGroups({
          store,
          t,
          sessions,
          isPinned: (sessionId) => {
            try {
              const snap = workspaces?.list?.getSnapshot?.()
              return snap?.pinnedSessionIds?.includes?.(sessionId) ?? false
            } catch {
              return false
            }
          },
          isArchived: (sessionId) => {
            try {
              const snap = workspaces?.list?.getSnapshot?.()
              return snap?.archivedSessionIds?.includes?.(sessionId) ?? false
            } catch {
              return false
            }
          },
          pinSession: (sessionId) => {
            ctx.uiWorkspace.pinSession(sessionId).catch((err) => {
              ctx.logger?.warn?.(`topics: could not pin session: ${String(err?.message ?? err)}`)
            })
          },
          unpinSession: (sessionId) => {
            ctx.uiWorkspace.unpinSession(sessionId).catch((err) => {
              ctx.logger?.warn?.(`topics: could not unpin session: ${String(err?.message ?? err)}`)
            })
          },
          archiveSession: (sessionId) => {
            ctx.uiWorkspace.archiveSession(sessionId).catch((err) => {
              ctx.logger?.warn?.(`topics: could not archive session: ${String(err?.message ?? err)}`)
            })
          },
          unarchiveSession: (sessionId) => {
            ctx.uiWorkspace.unarchiveSession(sessionId).catch((err) => {
              ctx.logger?.warn?.(`topics: could not unarchive session: ${String(err?.message ?? err)}`)
            })
          },
          renameSession: (session) => {
            dialog.open({
              title: t('rename.session.title', '重命名会话'),
              value: session.title,
              confirmLabel: t('renameConfirm'),
              onSubmit: async (newName) => {
                if (typeof sessions?.using === 'function') {
                  const res = await sessions.using(session.sessionId, { source: 'workspaceOperation' }, (ref) => ref.binding.session.rename(newName))
                  if (res && !res.ok) throw new Error(res.error.message)
                }
              },
            })
          },
          forkSession: async (sessionId, topicId) => {
            try {
              const childId = await ctx.uiWorkspace.forkSession(sessionId)
              if (typeof childId === 'string') {
                await store.bind(childId, topicId)
              }
            } catch (err) {
              ctx.logger?.warn?.(`topics: could not fork session: ${String(err?.message ?? err)}`)
            }
          },
          copySessionId: (sessionId) => {
            if (navigator?.clipboard?.writeText) {
              navigator.clipboard.writeText(sessionId).catch(() => {})
            }
          },
          unbindSession: (sessionId) => {
            void store.bind(sessionId, undefined)
          },
          openSession: (sessionId) => ctx.uiWorkspace.openSession(sessionId),
          details: (topic) => details.open(topic),
          rename: (topic) => dialog.open({
            title: t('renameTitle'),
            value: topic.title,
            confirmLabel: t('renameConfirm'),
            onSubmit: (name) => store.rename(topic.id, name),
          }),
          remove: (topic) => {
            void store.remove(topic.id).catch((error) => {
              ctx.logger?.warn?.(`topics: could not delete a topic: ${String(error?.message ?? error)}`)
            })
          },
          /* Reuse the Workspace's blank Session the way the shipped sidebar
             does, then bind it to the topic: one placeholder per Workspace, and
             a blank that is walked away from stops being rendered anywhere. */
          newSession: async (topicId) => {
            try {
              const workspaceId = store.get().workspaceId
              let sessionId
              if (typeof workspaceId === 'string' && typeof ctx.uiWorkspace.connectWorkspace === 'function') {
                sessionId = await ctx.uiWorkspace.connectWorkspace(workspaceId)
                if (typeof sessionId === 'string') await store.bind(sessionId, topicId)
              } else {
                const value = await store.createSession(topicId)
                sessionId = value.sessionId
              }
              if (typeof sessionId === 'string') ctx.uiWorkspace.openSession(sessionId)
            } catch (error) {
              ctx.logger?.warn?.(`topics: could not open a Session: ${String(error?.message ?? error)}`)
            }
          },
        }), 'topics: sidebar groups')

        ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register({
          name: 'sidebar.session.row.leading',
          id: 'topics-mark',
          order: 20,
          locale: NS,
          inject: () => ({ store }),
        }, SessionTopicMark))

        ctx.slots.inject('sidebar.workspaces.session.menu.item', () => ctx.slots.register({
          name: 'sidebar.workspaces.session.menu.item',
          id: 'topics-bind',
          order: 460,
          locale: NS,
          inject: () => ({ store }),
        }, SessionTopicMenuItem))
      },
    }
  },
})
