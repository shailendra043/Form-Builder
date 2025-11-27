import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function App(){
  const [qs] = useSearchParams();
  const userId = qs.get('userId') || localStorage.getItem('userId');
  if (qs.get('userId')) localStorage.setItem('userId', qs.get('userId'));

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  return (
    <div style={{padding:20}}>
      <h2>Airtable Form Builder (Minimal)</h2>
      <div>
        <a href={`${backend}/auth/airtable`}><button>Log in with Airtable</button></a>
        {userId && <span style={{marginLeft:10}}>Logged-in user: {userId}</span>}
      </div>
      <nav style={{marginTop:20}}>
        <Link to="/builder">Form Builder</Link> | <Link to="/">Home</Link>
      </nav>
      <div style={{marginTop:20}}>
        <p>Use the builder to create forms based on your Airtable schema.</p>
      </div>
    </div>
  )
}
