import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/tokens.css'
import './styles/global.css'
import App from './App.jsx'

const savedTheme = window.localStorage.getItem('tablehub_theme')
document.documentElement.dataset.theme = savedTheme === 'dracula' ? 'dracula' : 'light'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
