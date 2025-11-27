import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

export default function ResponsesList(){
  const { formId } = useParams();
  const [responses, setResponses] = useState([]);
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const userId = localStorage.getItem('userId');

  useEffect(()=>{
    if (!userId) return;
    axios.get(`${backend}/api/forms/${formId}/responses`, { headers: { 'x-user-id': userId } }).then(r=>setResponses(r.data.responses)).catch(()=>{});
  },[formId]);

  return (
    <div style={{padding:20}}>
      <h3>Responses</h3>
      {responses.map(r=> (
        <div key={r._id} style={{border:'1px solid #ddd', padding:8, marginBottom:8}}>
          <div><strong>ID:</strong> {r._id}</div>
          <div><strong>Created:</strong> {new Date(r.createdAt).toLocaleString()}</div>
          <div><strong>Status:</strong> {r.deletedInAirtable ? 'deletedInAirtable' : r.status}</div>
          <div><strong>Answers:</strong> <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(r.answers,null,2)}</pre></div>
        </div>
      ))}
    </div>
  )
}
