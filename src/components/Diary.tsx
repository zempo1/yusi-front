import { Button, Textarea, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input } from './ui'
import { toast } from 'sonner'
import { useState, useEffect, useCallback } from 'react'
import { writeDiary, editDiary, getDiaryList, generateAiResponse, type Diary as DiaryType } from '../lib'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Lock, MessageCircle, Edit2, X, Settings, Unlock, Book } from 'lucide-react'
import { useChatStore } from '../stores'
import { useEncryptionStore } from '../stores/encryptionStore'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'

export const Diary = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [genLoading, setGenLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [diaries, setDiaries] = useState<DiaryType[]>([])
  const [decryptedContents, setDecryptedContents] = useState<Record<string, string>>({})
  const userId = user?.userId || ''

  const { setIsOpen, setInitialMessage } = useChatStore()
  const {
    initialize: initEncryption,
    hasActiveKey,
    encrypt,
    decrypt,
    keyMode,
    isInitialized: encryptionInitialized,
    cryptoKey
  } = useEncryptionStore()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error('AI知己需要登录后使用')
      navigate('/login', { state: { from: '/diary' } })
    }
  }, [user, navigate])

  // Initialize encryption on mount
  useEffect(() => {
    initEncryption()
  }, [initEncryption])

  // Decrypt a single diary content
  const decryptDiary = useCallback(async (diary: DiaryType): Promise<string> => {
    if (!diary.clientEncrypted || !cryptoKey) {
      return diary.content
    }
    try {
      return await decrypt(diary.content)
    } catch {
      console.warn('Failed to decrypt diary:', diary.diaryId)
      return '[无法解密，请检查密钥]'
    }
  }, [cryptoKey, decrypt])

  // Load and decrypt diaries
  const loadDiaries = useCallback(async () => {
    if (!userId) return
    try {
      const list = await getDiaryList(userId)
      setDiaries(list)

      // Decrypt contents if we have an active key
      if (hasActiveKey()) {
        const decrypted: Record<string, string> = {}
        for (const diary of list) {
          decrypted[diary.diaryId] = await decryptDiary(diary)
        }
        setDecryptedContents(decrypted)
      }
    } catch (e) {
      console.error('Failed to load diaries', e)
    }
  }, [userId, hasActiveKey, decryptDiary])

  useEffect(() => {
    if (encryptionInitialized) {
      loadDiaries()
    }
  }, [encryptionInitialized, loadDiaries])

  // Re-decrypt when key becomes available
  useEffect(() => {
    if (cryptoKey && diaries.length > 0) {
      const decryptAll = async () => {
        const decrypted: Record<string, string> = {}
        for (const diary of diaries) {
          decrypted[diary.diaryId] = await decryptDiary(diary)
        }
        setDecryptedContents(decrypted)
      }
      decryptAll()
    }
  }, [cryptoKey, diaries, decryptDiary])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('标题与内容不能为空')
      return
    }

    if (!hasActiveKey()) {
      toast.error('请先解锁或配置密钥')
      navigate('/settings')
      return
    }

    setLoading(true)
    try {
      // Encrypt content before sending
      const encryptedContent = await encrypt(content)

      // 获取 hasCloudBackup 状态
      const { hasCloudBackup } = useEncryptionStore.getState()

      // 判断是否允许 RAG：DEFAULT 模式或 CUSTOM + 云端备份
      const allowRag = keyMode === 'DEFAULT' || hasCloudBackup

      // 如果允许 RAG，同时发送明文用于向量化
      const plainContent = allowRag ? content : undefined

      if (editingId) {
        await editDiary({
          userId,
          diaryId: editingId,
          title,
          content: encryptedContent,
          entryDate: date,
          clientEncrypted: true,
          plainContent
        })
        toast.success('日记已更新')
        setEditingId(null)
      } else {
        await writeDiary({
          userId,
          title,
          content: encryptedContent,
          entryDate: date,
          clientEncrypted: true,
          plainContent
        })
        toast.success('日记已保存')
      }
      setTitle('')
      setContent('')
      setDate(new Date().toISOString().split('T')[0])
      loadDiaries()
    } catch (e) {
      toast.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (diary: DiaryType) => {
    setEditingId(diary.diaryId)
    setTitle(diary.title)
    // Use decrypted content
    const decrypted = decryptedContents[diary.diaryId] || diary.content
    setContent(decrypted)
    setDate(diary.entryDate)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setDate(new Date().toISOString().split('T')[0])
  }

  const handleGenerate = async (diaryId: string) => {
    setGenLoading(diaryId)
    try {
      await generateAiResponse(diaryId)
      toast.success('AI回应生成中，请稍候刷新')
      setTimeout(loadDiaries, 3000)
    } catch (e) {
      // error handled
    } finally {
      setGenLoading(null)
    }
  }

  const handleChat = (diary: DiaryType) => {
    const decryptedContent = decryptedContents[diary.diaryId] || diary.content
    const context = `我刚写了一篇日记：\n标题：${diary.title}\n内容：${decryptedContent}\n\nAI的回应是：${diary.aiResponse}\n\n`
    setInitialMessage(context)
    setIsOpen(true)
  }

  // Get display content (decrypted if available)
  const getDisplayContent = (diary: DiaryType): string => {
    if (!diary.clientEncrypted) {
      return diary.content
    }
    return decryptedContents[diary.diaryId] || '[🔒 内容已加密，请解锁查看]'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 justify-center md:justify-start">
             <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Book className="w-6 h-6" />
             </div>
             <span className="text-gradient">AI知己 · 私密日记</span>
          </h2>
          <p className="text-muted-foreground">端到端加密，仅你可见，AI 伴你同行。</p>
        </div>

        {/* Encryption status indicator */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm bg-card/50 backdrop-blur border border-border/50 shadow-sm">
          {keyMode === 'CUSTOM' ? (
            cryptoKey ? (
              <>
                <Unlock className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">自定义密钥 · 已解锁</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">自定义密钥 · 已锁定</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 ml-1" onClick={() => navigate('/settings')}>
                  解锁
                </Button>
              </>
            )
          ) : (
            <>
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">默认密钥 · 自动保护</span>
            </>
          )}
           <div className="w-px h-4 bg-border mx-1" />
           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('/settings')} title="密钥设置">
              <Settings className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl">
            <CardHeader>
            <CardTitle className="text-xl">{editingId ? '编辑日记' : '写日记'}</CardTitle>
            <CardDescription>记录你的经历、想法与感受。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">日期</label>
                <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-background/50 backdrop-blur-sm"
                />
                </div>
                <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">标题</label>
                <Input
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    placeholder="给今天起个名字..."
                    className="bg-background/50 backdrop-blur-sm"
                />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">内容</label>
                <Textarea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                rows={10}
                placeholder="此刻你在想什么？..."
                className="resize-none bg-background/50 backdrop-blur-sm min-h-[200px] leading-relaxed"
                />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border/50 pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                所有内容端到端加密，仅用于AI分析
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
                {editingId && (
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                    <X className="w-4 h-4 mr-1" /> 取消
                </Button>
                )}
                <Button isLoading={loading} onClick={handleSave} className="flex-1 sm:flex-none px-8 shadow-lg shadow-primary/20">
                {editingId ? '更新日记' : '保存日记'}
                </Button>
            </div>
            </CardFooter>
        </Card>
      </motion.div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold px-2 border-l-4 border-primary/50 pl-4">历史日记</h3>
        
        {diaries.length === 0 ? (
           <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
              <Book className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">暂无日记，开始记录第一篇吧</p>
           </div>
        ) : (
           <div className="grid gap-6">
            {diaries.map((diary, index) => (
                <motion.div
                key={diary.diaryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/40">
                    <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-primary">{diary.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <span>{diary.entryDate}</span>
                            {diary.clientEncrypted && (
                            <span className="inline-flex items-center text-[10px] bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground border">
                                <Lock className="w-3 h-3 mr-1" /> 已加密
                            </span>
                            )}
                        </CardDescription>
                        </div>
                        <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(diary)} title="编辑">
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {getDisplayContent(diary)}
                    </div>
                    
                    {diary.aiResponse && (
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                        <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                            <Sparkles className="w-4 h-4" />
                            AI 回应
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                            {diary.aiResponse}
                        </p>
                        </div>
                    )}
                    </CardContent>
                    <CardFooter className="bg-muted/10 flex justify-end gap-3 py-3 px-6">
                    {!diary.aiResponse ? (
                        <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleGenerate(diary.diaryId)}
                        isLoading={genLoading === diary.diaryId}
                        className="text-xs"
                        >
                        <Sparkles className="w-3 h-3 mr-1" />
                        生成 AI 回应
                        </Button>
                    ) : (
                        <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleChat(diary)}
                        className="text-xs group hover:border-primary/50 hover:text-primary"
                        >
                        <MessageCircle className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                        继续对话
                        </Button>
                    )}
                    </CardFooter>
                </Card>
                </motion.div>
            ))}
           </div>
        )}
      </div>
    </div>
  )
}
