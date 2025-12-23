import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Layout } from '../components/Layout'
import { RoomSubmit, RoomReport } from '../components/room'
import { getReport, getRoom, cancelRoom, startRoom, voteCancelRoom, getScenarios } from '../lib'
import { useRoomStore } from '../stores'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui'
import { toast } from 'sonner'
import type { PersonalSketch, PairCompatibility, Scenario } from '../lib'
import { Play, Copy, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export const Room = () => {
  const { code } = useParams<{ code: string }>()
  const room = useRoomStore((s) => s.rooms[code!])
  const setRoom = useRoomStore((s) => s.setRoom)
  const [report, setReport] = useState<{ 
    personal: PersonalSketch[]; 
    pairs: PairCompatibility[];
    publicSubmissions?: { userId: string; content: string }[];
  } | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const userId = localStorage.getItem('yusi-user-id') || ''
  const timerRef = useRef<any>(null)
  const [starting, setStarting] = useState(false)

  const fetchRoom = async () => {
    if (!code) return
    try {
      const data = await getRoom(code)
      setRoom(code, data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    getScenarios().then(setScenarios).catch(console.error)
  }, [])

  useEffect(() => {
    fetchRoom()
    timerRef.current = setInterval(fetchRoom, 2000)
    return () => {
        if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [code])

  useEffect(() => {
    if (!code) return
    if (room?.status === 'COMPLETED' && !report) {
      getReport(code).then((r) => setReport({ 
        personal: r.personal, 
        pairs: r.pairs,
        publicSubmissions: r.publicSubmissions 
      }))
    }
  }, [code, room?.status])
  
  const handleCancel = async () => {
      if (!code || !userId) return
      if (!confirm('确定要解散房间吗？')) return
      
      try {
          await cancelRoom(code, userId)
          toast.success('房间已解散')
          window.location.href = '/'
      } catch (e) {
          // handled
      }
  }

  const handleVoteCancel = async () => {
    if (!code || !userId) return
    if (!confirm('确定要投票解散房间吗？')) return
    try {
      await voteCancelRoom(code, userId)
      toast.success('已投票')
      fetchRoom()
    } catch (e) {
      // handled
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code || '')
    toast.success('房间号已复制')
  }

  const handleStart = async () => {
      if (!code || !userId) return
      if (room.members.length < 2) {
          toast.error('至少需要2人才能开始')
          return
      }
      if (scenarios.length === 0) {
          toast.error('没有可用的情景')
          return
      }
      setStarting(true)
      try {
          // TODO: Let user select scenario. For now use default '1'
          await startRoom({ code, scenarioId: scenarios[0].id, ownerId: userId })
          toast.success('房间已开始')
          fetchRoom()
      } catch (e) {
          // handled
      } finally {
          setStarting(false)
      }
  }


  if (!room) {
    return (
      <Layout>
        <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="text-lg">正在寻找房间信息...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (room.status === 'CANCELLED') {
    return (
      <Layout>
        <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="text-lg">房间已被解散</div>
            <Button onClick={() => window.location.href = '/'}>返回首页</Button>
        </div>
      </Layout>
    )
  }

  const submitted = room.submissions[userId]

  const isOwner = room.ownerId === userId

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">房间 {code}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={copyCode} title="复制房间号">
                  <Copy className="w-4 h-4" />
              </Button>
            </div>
            {/* Mobile Status Badge */}
            <div className="md:hidden">
              <Badge 
                variant={
                  room.status === 'WAITING' ? 'secondary' :
                  room.status === 'IN_PROGRESS' ? 'default' :
                  'outline'
                }
                className="text-xs px-2 py-0.5"
              >
                {room.status === 'WAITING' && '等待中'}
                {room.status === 'IN_PROGRESS' && '进行中'}
                {room.status === 'COMPLETED' && '已完成'}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            {room.status === 'WAITING' && isOwner && (
                <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleStart}
                    isLoading={starting}
                    disabled={room.members.length < 2}
                    className="w-full md:w-auto"
                  >
                      <Play className="w-4 h-4 mr-1" /> 开始
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleCancel} className="w-full md:w-auto">
                      解散
                  </Button>
                </div>
            )}

            {room.status === 'IN_PROGRESS' && (
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    {isOwner ? (
                        <Button variant="danger" size="sm" onClick={handleCancel} className="flex-1 md:flex-none">
                           强制解散
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={handleVoteCancel} disabled={room.cancelVotes?.includes(userId)} className="flex-1 md:flex-none">
                           {room.cancelVotes?.includes(userId) ? '已投票' : '投票解散'}
                        </Button>
                    )}
                    {room.cancelVotes && room.cancelVotes.length > 0 && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto md:ml-0">
                            解散投票: {room.cancelVotes.length}/{Math.floor(room.members.length / 2) + 1}
                        </span>
                    )}
                </div>
            )}

            {/* Desktop Status Badge */}
            <div className="hidden md:block">
              <Badge 
                variant={
                  room.status === 'WAITING' ? 'secondary' :
                  room.status === 'IN_PROGRESS' ? 'default' :
                  'outline'
                }
                className="text-sm px-3 py-1"
              >
                {room.status === 'WAITING' && '等待中'}
                {room.status === 'IN_PROGRESS' && '进行中'}
                {room.status === 'COMPLETED' && '已完成'}
              </Badge>
            </div>
          </div>
        </div>

        {room.status === 'IN_PROGRESS' && room.scenario && (
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl">{room.scenario.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                    <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{room.scenario.description}</p>
                </CardContent>
            </Card>
        )}

        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                成员 ({room.members.length}/8)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-2 md:pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 md:gap-4">
              {room.members.map((m) => {
                  const hasSubmitted = !!room.submissions[m]
                  const name = room.memberNames?.[m] || m
                  const isHost = m === room.ownerId
                  return (
                    <div key={m} className="flex items-center gap-2 bg-secondary/50 px-2 py-1.5 md:px-3 md:py-2 rounded-lg border overflow-hidden">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs md:text-sm font-medium flex items-center gap-1 truncate">
                                <span className="truncate">{name}</span>
                                {isHost && <Badge variant="outline" className="text-[10px] h-3 px-1 shrink-0">房主</Badge>}
                            </span>
                        </div>
                        {room.status === 'IN_PROGRESS' && (
                            <div className="ml-auto shrink-0">
                              {hasSubmitted ? 
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" /> : 
                              <Clock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                              }
                            </div>
                        )}
                    </div>
                  )
              })}
            </div>
          </CardContent>
        </Card>

        {room.status === 'IN_PROGRESS' && !submitted && (
          <RoomSubmit code={code!} userId={userId} />
        )}

        {room.status === 'IN_PROGRESS' && submitted && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
              <p>你已提交，请耐心等待其他成员...</p>
            </CardContent>
          </Card>
        )}

        {room.status === 'COMPLETED' && report && (
          <RoomReport 
            personal={report.personal} 
            pairs={report.pairs} 
            publicSubmissions={report.publicSubmissions}
            memberNames={room.memberNames}
          />
        )}
      </div>
    </Layout>
  )
}