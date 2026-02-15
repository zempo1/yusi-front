import { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Textarea, toast } from '../ui'
import { submitScenario, getMyScenarios, updateScenario, deleteScenario, resubmitScenario, getStatusText, getStatusColor, STATUS_PENDING, STATUS_MANUAL_APPROVED, STATUS_AI_APPROVED, type MyScenario } from '../../lib/room'
import { useRequireAuth } from '../../lib'
import { Info, X, CheckCircle, AlertCircle, PenTool, Users, History, Trash2, RefreshCw, Edit2 } from 'lucide-react'

export const ScenarioSubmit = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [myScenarios, setMyScenarios] = useState<MyScenario[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [editingScenario, setEditingScenario] = useState<MyScenario | null>(null)
  const { requireAuth } = useRequireAuth()

  const fetchMyScenarios = async () => {
    setLoadingHistory(true)
    try {
      const scenarios = await getMyScenarios()
      setMyScenarios(scenarios)
    } catch {
      toast.error('获取投稿记录失败')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (showHistory) {
      fetchMyScenarios()
    }
  }, [showHistory])

  const handleSubmit = async () => {
    if (!requireAuth('投稿情景需要登录')) {
      return
    }
    if (!title || !description) {
      toast.error('请填写完整信息')
      return
    }
    setLoading(true)
    try {
      if (editingScenario) {
        await updateScenario(editingScenario.id, { title, description })
        toast.success('修改成功，状态已重置为待审核')
        setEditingScenario(null)
      } else {
        await submitScenario({ title, description })
        toast.success('投稿成功，等待审核')
      }
      setTitle('')
      setDescription('')
      if (showHistory) {
        fetchMyScenarios()
      }
    } catch {
      toast.error('提交失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (scenario: MyScenario) => {
    setEditingScenario(scenario)
    setTitle(scenario.title)
    setDescription(scenario.description)
    setShowHistory(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个情景吗？')) return
    try {
      await deleteScenario(id)
      toast.success('删除成功')
      fetchMyScenarios()
    } catch {
      toast.error('删除失败')
    }
  }

  const handleResubmit = async (id: string) => {
    try {
      await resubmitScenario(id)
      toast.success('重新提交成功')
      fetchMyScenarios()
    } catch {
      toast.error('重新提交失败')
    }
  }

  const handleCancelEdit = () => {
    setEditingScenario(null)
    setTitle('')
    setDescription('')
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                投稿情景
                <button
                  onClick={() => setShowGuide(true)}
                  className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                  title="查看投稿规范"
                >
                  <Info className="w-4 h-4" />
                </button>
              </CardTitle>
              <CardDescription>分享你的创意情景，审核通过后将展示给所有人。</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!requireAuth('查看投稿记录需要登录')) return
                setShowHistory(true)
              }}
              className="text-muted-foreground hover:text-primary"
            >
              <History className="w-4 h-4 mr-1" />
              投稿记录
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          {editingScenario && (
            <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-600 dark:text-amber-400">
              <span>正在编辑：{editingScenario.title}</span>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                取消
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入情景标题" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入情景描述（背景、冲突、角色等）"
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button isLoading={loading} onClick={handleSubmit} className="w-full">
            {editingScenario ? '保存修改' : '提交审核'}
          </Button>
        </CardFooter>
      </Card>

      {/* 情景投稿规范弹窗 */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-card w-full max-w-lg border border-border rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <PenTool className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">情景投稿规范</h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  优质情景特征
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2 pl-6">
                  <li>• <strong>有明确背景</strong>：设定清晰的时间、地点、人物关系</li>
                  <li>• <strong>有冲突张力</strong>：包含需要做出选择的困境或矛盾</li>
                  <li>• <strong>开放性结局</strong>：允许多种合理的应对方式</li>
                  <li>• <strong>引发思考</strong>：能触发对价值观、性格的探索</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  投稿注意事项
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2 pl-6">
                  <li>• 内容需积极向上，不含敏感、违法信息</li>
                  <li>• 避免过于简单或只有一个"正确答案"</li>
                  <li>• 标题简洁有力，描述生动具体</li>
                  <li>• 投稿后需等待审核，通过后即可公开</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-blue-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  示例参考
                </h3>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="font-medium text-foreground">标题：电梯里的沉默</p>
                  <p>你和一个刚认识的同事一起乘电梯，突然电梯停在两层楼之间。灯光闪烁，对方开始紧张地呼吸急促...</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-border">
              <Button onClick={() => setShowGuide(false)}>
                我知道了
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 投稿记录弹窗 */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="bg-card w-full max-w-2xl max-h-[80vh] border border-border rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <History className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">我的投稿记录</h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : myScenarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无投稿记录</div>
              ) : (
                <div className="space-y-4">
                  {myScenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold truncate">{scenario.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(scenario.status)}`}>
                              {getStatusText(scenario.status)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                          {scenario.rejectReason && (
                            <p className="text-sm text-destructive mt-2">
                              拒绝原因：{scenario.rejectReason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {scenario.status !== STATUS_PENDING && scenario.status !== STATUS_MANUAL_APPROVED && scenario.status !== STATUS_AI_APPROVED && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResubmit(scenario.id)}
                              title="重新提交"
                            >
                              <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          )}
                          {scenario.status !== STATUS_PENDING && scenario.status !== STATUS_MANUAL_APPROVED && scenario.status !== STATUS_AI_APPROVED && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(scenario)}
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(scenario.id)}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-border shrink-0">
              <Button onClick={() => setShowHistory(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
