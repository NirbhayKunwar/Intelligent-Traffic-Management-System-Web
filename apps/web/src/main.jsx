import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The main entry point of the application, responsible for rendering the App component within a StrictMode wrapper for highlighting potential issues in the application. The createRoot function from React DOM is used to create a root container for the application, and the App component is rendered inside this container. This setup ensures that the application is initialized properly and can take advantage of React's concurrent features when available.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
