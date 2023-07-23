import * as dgram from 'dgram'
import { createServer, Server } from 'net'


const PORT = parseInt(process.env.PORT) || 9999
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT) || 8888

const server = dgram.createSocket('udp4')

server.on('listening', () => {
  console.info(`Server listening on ${PORT}`)
  server.setRecvBufferSize(4096) // 4kb
  server.setSendBufferSize(4096) // 4kb
  startHealthCheckEndpoint(HEALTH_PORT)
})

server.on('error', (args) => {
  console.error('UDP Listener Error')
  console.error('Error ', JSON.stringify(args))
  // todo : do something
})

server.on('message', async (data: Buffer, remote: dgram.RemoteInfo) => {
  console.log(`${new Date()} Incoming message `, data.toString())

  server.send(`we received ${data}`, remote.port, remote.address, err => {
    if (err) {
      console.error(`error sending response ${err}`)
    }
  })

})

server.bind(PORT)

function startHealthCheckEndpoint(port: number): Server {

  const server = createServer(function (socket) {
    socket.write('Echo server\r\n')
    socket.pipe(socket)
  })

  server.on('error', (err) => {
    console.error('health check endpoint error', err)
  })

  return server.listen(port, () => {
    console.info('TCP health check endpoint listening on ' + port)
  })
}
