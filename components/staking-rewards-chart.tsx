'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface RewardChartProps {
  stakedAmount: number
  apy: number
  days?: number
}

export default function StakingRewardsChart({ stakedAmount, apy, days = 30 }: RewardChartProps) {
  const [data, setData] = useState<Array<{ day: number; rewards: number; balance: number }>>([])

  useEffect(() => {
    const chartData = []
    let accumulatedRewards = 0
    const dailyReward = stakedAmount * (apy / 100 / 365)

    for (let day = 0; day <= days; day++) {
      accumulatedRewards = dailyReward * day
      chartData.push({
        day,
        rewards: accumulatedRewards,
        balance: stakedAmount + accumulatedRewards,
      })
    }

    setData(chartData)
  }, [stakedAmount, apy, days])

  return (
    <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#f8e1f4]">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Reward Projection
        </CardTitle>
        <CardDescription className="text-[#c0c0c0]">
          {days} day projection at {apy.toFixed(2)}% APY
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a2a34" />
            <XAxis
              dataKey="day"
              stroke="#c0c0c0"
              label={{ value: 'Days', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis stroke="#c0c0c0" label={{ value: 'SOL', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a0a14', border: '1px solid #8b005d' }}
              labelStyle={{ color: '#f8e1f4' }}
              formatter={(value: any) => `${(value as number).toFixed(6)} SOL`}
            />
            <Line
              type="monotone"
              dataKey="rewards"
              stroke="#d4308e"
              strokeWidth={2}
              isAnimationActive={false}
              name="Accumulated Rewards"
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#8b005d"
              strokeWidth={2}
              isAnimationActive={false}
              name="Total Balance"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-2 bg-[#0b0b0b]/70 rounded border border-[#3a2a34]">
            <p className="text-xs text-[#c0c0c0]">Daily Reward</p>
            <p className="text-[#f8e1f4] font-bold">
              {(stakedAmount * (apy / 100 / 365)).toFixed(6)} SOL
            </p>
          </div>
          <div className="p-2 bg-[#0b0b0b]/70 rounded border border-[#3a2a34]">
            <p className="text-xs text-[#c0c0c0]">{days}-Day Total</p>
            <p className="text-green-400 font-bold">
              {(stakedAmount * (apy / 100 / 365) * days).toFixed(6)} SOL
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
