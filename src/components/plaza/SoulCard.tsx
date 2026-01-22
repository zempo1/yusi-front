import { Card, Button, Badge } from '../ui'
import { Heart, HandHeart, MessageCircleHeart } from 'lucide-react'
import { type SoulCard as SoulCardType, resonate } from '../../lib'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../../utils'

interface SoulCardProps {
    card: SoulCardType
}

// 情感标签映射：后端英文值 -> 中文显示
const EMOTION_LABELS: Record<string, string> = {
    'Joy': '喜悦',
    'Sadness': '悲伤',
    'Anxiety': '焦虑',
    'Love': '温暖',
    'Anger': '愤怒',
    'Fear': '恐惧',
    'Hope': '希望',
    'Calm': '平静',
    'Confusion': '困惑',
    'Neutral': '随想',
}

export const SoulCard = ({ card }: SoulCardProps) => {
    const [count, setCount] = useState(card.resonanceCount)
    const [resonated, setResonated] = useState(card.isResonated || false)
    const [loading, setLoading] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const handleResonate = async (type: 'EMPATHY' | 'HUG' | 'SAME_HERE') => {
        if (resonated) return
        setLoading(true)
        try {
            await resonate(card.id, type)
            setCount(prev => prev + 1)
            setResonated(true)
            setShowOptions(false)
            toast.success('已共鸣')
        } catch (e: unknown) {
            if (e instanceof Error && e.message?.includes('共鸣')) {
                setResonated(true) // assume already resonated
                setShowOptions(false)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="break-inside-avoid mb-6">
            <Card className="glass-card overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border-white/20 dark:border-white/5 group">
                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                            {card.type === 'DIARY' ? '日记' : '情景'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium opacity-60">{new Date(card.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-sm leading-7 whitespace-pre-wrap font-sans text-foreground/90 min-h-[80px]">
                        {card.content.length > 150 ? card.content.substring(0, 150) + '...' : card.content}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/50">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {card.emotion && <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-[10px] font-medium">#{EMOTION_LABELS[card.emotion] || card.emotion}</span>}
                        </div>

                        <div className="relative">
                            {!resonated && showOptions && (
                                <div className="absolute bottom-full right-0 mb-3 flex gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-full p-1.5 z-10 animate-in fade-in slide-in-from-bottom-2 zoom-in-95">
                                    <Button
                                        variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                                        onClick={() => handleResonate('EMPATHY')} disabled={loading} title="共情"
                                    >
                                        <Heart className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-orange-50 hover:text-orange-500 transition-colors"
                                        onClick={() => handleResonate('HUG')} disabled={loading} title="拥抱"
                                    >
                                        <HandHeart className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors"
                                        onClick={() => handleResonate('SAME_HERE')} disabled={loading} title="同感"
                                    >
                                        <MessageCircleHeart className="w-5 h-5" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 px-3 text-xs gap-1.5 rounded-full transition-all duration-300",
                                    resonated 
                                        ? "text-red-500 bg-red-50 dark:bg-red-950/20" 
                                        : "hover:bg-primary/5 hover:text-primary"
                                )}
                                onClick={() => !resonated && setShowOptions(!showOptions)}
                                disabled={resonated && !loading}
                            >
                                <Heart className={cn("w-4 h-4 transition-transform", resonated && "fill-current scale-110")} />
                                <span className="font-medium">{count > 0 ? count : '共鸣'}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
