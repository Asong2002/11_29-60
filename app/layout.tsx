import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arin - AI情感交互机器人',
  description: '一个友好的AI助手，具有情感反应功能',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

