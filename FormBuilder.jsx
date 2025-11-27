import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function FormBuilder(){
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedFields, setSelectedFields] = useState({});
  const [title, setTitle] = useState('');

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const userId = localStorage.getItem('userId');

  useEffect(()=>{
    if (!userId) return;
    axios.get(`${backend}/api/forms/bases`, { headers: { 'x-user-id': userId } }).then(r=>setBases(r.data.bases)).catch(()=>{});
  },[])

  useEffect(()=>{
    if (!selectedBase) return;
    axios.get(`${backend}/api/forms/tables/${selectedBase}`, { headers: { 'x-user-id': userId } }).then(r=>setTables(r.data.tables)).catch(()=>{});
  },[selectedBase])

  useEffect(()=>{
    if (!selectedTable) return;
    axios.get(`${backend}/api/forms/fields/${selectedBase}/${selectedTable}`, { headers: { 'x-user-id': userId } }).then(r=>setFields(r.data.fields)).catch(()=>{});
  },[selectedTable])

  function toggleField(f){
    setSelectedFields(s => {
      const copy = {...s};
      if (copy[f.id]) delete copy[f.id]; else copy[f.id] = { questionKey: f.name.replace(/\s+/g,'_'), required: false };
      return copy;
    })
  }

  async function saveForm(){
    const questions = Object.keys(selectedFields).map(id => ({ questionKey: selectedFields[id].questionKey, airtableFieldId: id, label: selectedFields[id].questionKey, required: selectedFields[id].required }));
    await axios.post(`${backend}/api/forms`, { title, airtableBaseId: selectedBase, airtableTableId: selectedTable, airtableTableName: tables.find(t=>t.id===selectedTable)?.name, questions }, { headers: { 'x-user-id': userId } });
    alert('Form saved');
  }

  return (
    <div style={{padding:20}}>
      <h3>Form Builder</h3>
      <div>
        <label>Title: <input value={title} onChange={e=>setTitle(e.target.value)} /></label>
      </div>
      <div>
        <label>Base: <select value={selectedBase} onChange={e=>setSelectedBase(e.target.value)}>
          <option value="">--select--</option>
          {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select></label>
      </div>
      <div>
        <label>Table: <select value={selectedTable} onChange={e=>setSelectedTable(e.target.value)}>
          <option value="">--select--</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select></label>
      </div>
      <div>
        <h4>Fields</h4>
        {fields.map(f=> (
          <div key={f.id}>
            <label><input type="checkbox" onChange={()=>toggleField(f)} checked={!!selectedFields[f.id]} /> {f.name} ({f.type})</label>
          </div>
        ))}
      </div>
      <div style={{marginTop:10}}>
        <button onClick={saveForm}>Save Form</button>
      </div>
    </div>
  )
}
