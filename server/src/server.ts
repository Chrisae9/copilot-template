import { createServer } from 'http';
import { app, io } from './index';

const server = createServer(app);
const PORT = process.env.PORT || 3001;

io.attach(server);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🎲 Game API: http://localhost:${PORT}/api/status`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🎮 Game client served from: http://localhost:${PORT}`);
    }
});
