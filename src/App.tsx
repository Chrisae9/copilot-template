import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            TypeScript React Vite Template
          </h1>
          <p className="text-lg text-gray-600">
            A modern web application template
          </p>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-500">
            Built with React, TypeScript, Vite, and Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  )
}

function Home() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome Home</h2>
        <p className="text-gray-700 mb-4">
          This is a clean TypeScript React Vite template with Tailwind CSS for styling.
          It includes:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>React 19 with TypeScript</li>
          <li>Vite for fast development and building</li>
          <li>Tailwind CSS v4 for styling</li>
          <li>React Router for navigation</li>
          <li>ESLint and Prettier for code quality</li>
          <li>Vitest for testing</li>
          <li>Docker setup for containerized development</li>
        </ul>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">About This Template</h2>
        <p className="text-gray-700">
          This template provides a solid foundation for building modern web applications
          with React and TypeScript. Start building your application by modifying the
          components and adding your own features.
        </p>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-700">
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  )
}

export default App
