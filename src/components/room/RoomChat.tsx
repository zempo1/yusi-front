import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, ChevronDown } from 'lucide-react'
import { Button, Input } from '../ui'
import { sendRoomMessage, pollRoomMessages, type RoomMessage } from '../../lib'
import { toast } from 'sonner'
import { cn } from '../../utils'

interface RoomChatProps {
    roomCode: string
    roomStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

export const RoomChat = ({ roomCode, roomStatus }: RoomChatProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<RoomMessage[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const lastMessageTimeRef = useRef<string | null>(null)
    const currentUserId = localStorage.getItem('yusi-user-id') || ''

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // 轮询消息
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const newMessages = await pollRoomMessages(
                    roomCode,
                    lastMessageTimeRef.current || undefined
                )
                if (newMessages.length > 0) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id))
                        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id))
                        if (uniqueNew.length > 0) {
                            // 更新最后消息时间
                            lastMessageTimeRef.current = uniqueNew[uniqueNew.length - 1].createdAt
                            // 如果窗口关闭，增加未读计数
                            if (!isOpen) {
                                setUnreadCount(prev => prev + uniqueNew.length)
                            }
                            return [...prev, ...uniqueNew]
                        }
                        return prev
                    })
                }
            } catch (e) {
                console.error('Failed to poll messages:', e)
            }
        }

        // 初始加载
        fetchMessages()

        // 每2秒轮询一次
        const interval = setInterval(fetchMessages, 2000)
        return () => clearInterval(interval)
    }, [roomCode, isOpen])

    // 打开时滚动到底部并清除未读
    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
            setUnreadCount(0)
        }
    }, [isOpen, messages.length])

    // 发送消息
    const handleSend = async () => {
        if (!input.trim() || sending) return

        setSending(true)
        try {
            const newMessage = await sendRoomMessage(roomCode, input.trim())
            setMessages(prev => [...prev, newMessage])
            lastMessageTimeRef.current = newMessage.createdAt
            setInput('')
            scrollToBottom()
        } catch (e: any) {
            toast.error(e.response?.data?.message || '发送失败')
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const canSend = roomStatus === 'WAITING' || roomStatus === 'IN_PROGRESS'

    // 格式化时间
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <>
            {/* 聊天按钮 */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40",
                    "w-12 h-12 md:w-14 md:h-14 rounded-full",
                    "bg-primary text-primary-foreground shadow-lg",
                    "flex items-center justify-center",
                    "hover:scale-110 transition-transform duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
            >
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* 聊天窗口 */}
            {isOpen && (
                <div className={cn(
                    "fixed z-50",
                    // 移动端全屏，PC端固定尺寸
                    "inset-0 md:inset-auto",
                    "md:bottom-6 md:right-6 md:w-96 md:h-[500px]",
                    "flex flex-col",
                    "bg-background md:rounded-xl md:shadow-2xl md:border"
                )}>
                    {/* 头部 */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-primary" />
                            <span className="font-semibold">房间聊天</span>
                            <span className="text-xs text-muted-foreground">
                                ({messages.length} 条消息)
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-muted rounded-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 消息列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>还没有消息</p>
                                <p className="text-sm">发送第一条消息吧！</p>
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.senderId === currentUserId
                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[80%]",
                                        isMe ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    {!isMe && (
                                        <span className="text-xs text-muted-foreground mb-1 px-1">
                                            {msg.senderName}
                                        </span>
                                    )}
                                    <div className={cn(
                                        "px-3 py-2 rounded-2xl break-words",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-br-sm"
                                            : "bg-muted rounded-bl-sm"
                                    )}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {formatTime(msg.createdAt)}
                                    </span>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 滚动到底部按钮 */}
                    {messages.length > 5 && (
                        <button
                            onClick={scrollToBottom}
                            className="absolute bottom-20 right-4 p-2 bg-muted rounded-full shadow-md hover:bg-muted/80 transition-colors"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    )}

                    {/* 输入框 */}
                    <div className="border-t p-3 bg-card/50 pb-safe">
                        {canSend ? (
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="输入消息..."
                                    className="flex-1"
                                    maxLength={500}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || sending}
                                    size="icon"
                                    className="shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground text-sm py-2">
                                房间已结束，无法发送消息
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
