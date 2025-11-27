import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { shouldShowQuestion } from '../utils/conditional'

export default function FormViewer(){
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const userId = localStorage.getItem('userId');

  useEffect(()=>{
    if (!userId) return;
    axios.get(`${backend}/api/forms/${formId}`, { headers: { 'x-user-id': userId } }).then(r=>setForm(r.data.form)).catch(()=>{});
  },[formId]);

  function onChange(key, value){
    setAnswers(a => ({ ...a, [key]: value }));
  }

  async function submit(){
    // simple required validation
    const res = await axios.post(`${backend}/api/forms/${formId}/submit`, { answers }, { headers: { 'x-user-id': userId } });
    alert('Submitted');
  }

  if (!form) return <div>Loading...</div>;

  return (
    <div style={{padding:20}}>
      <h3>{form.title || 'Form'}</h3>
      {form.questions.map(q => {
        const visible = shouldShowQuestion(q.conditionalRules, answers);
        if (!visible) return null;
        return (
          <div key={q.questionKey} style={{marginBottom:10}}>
            <label>{q.label || q.questionKey} {q.required ? '*' : ''}</label>
            <div>
              {q.type === 'singleSelect' && (
                <select onChange={e=>onChange(q.questionKey, e.target.value)}>
                  <option value="">--</option>
                  {q.options?.choices?.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              )}
              {(q.type === 'singleLineText' || q.type === 'multilineText') && (
                <input onChange={e=>onChange(q.questionKey, e.target.value)} />
              )}
              {q.type === 'multipleSelects' && (
                <select multiple onChange={e=> onChange(q.questionKey, Array.from(e.target.selectedOptions).map(o=>o.value))}>
                  {q.options?.choices?.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              )}
            </div>
          </div>
        )
      })}
      <div>
        <button onClick={submit}>Submit</button>
      </div>
    </div>
  )
}
