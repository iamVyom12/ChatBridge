import './globals.css'

export const metadata = {
  title: 'ChatBridge',
  description: 'Connect with people through seamless communication',
  icons: {
    icon: '/images/chat.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
