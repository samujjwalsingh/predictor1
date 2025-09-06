import React, { useState } from 'react'
import Papa from 'papaparse'
import axios from 'axios'


const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'


export default function App() {
const [file, setFile] = useState(null)
const [students, setStudents] = useState([])
const [filter, setFilter] = useState('all')
const [teacherName, setTeacherName] = useState('Teacher')
const [scheduleDate, setScheduleDate] = useState('')
const [scheduleTime, setScheduleTime] = useState('')


async function upload() {
if (!file) return alert('Choose CSV file')
const form = new FormData()
form.append('file', file)
const res = await axios.post(API_BASE + '/api/upload-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } })
setStudents(res.data.data || [])
}


function onFile(e) { setFile(e.target.files[0]) }


function filtered() {
if (filter === 'all') return students
return students.filter(s => s.category === filter)
}


async function sendEmails() {
const recipients = students.filter(s => s.category === 'red').map(s => ({ name: s.name, email: s.email }))
if (!recipients.length) return alert('No red students')
const res = await axios.post(API_BASE + '/api/send-emails', { recipients, teacherName, scheduleDate, scheduleTime })
alert('Email results: ' + JSON.stringify(res.data.results))
}


function exportCSV() {
const rows = students
axios.post(API_BASE + '/api/export', { rows }, { responseType: 'blob' }).then(r => {
const url = window.URL.createObjectURL(new Blob([r.data]));
const link = document.createElement('a');
link.href = url; link.setAttribute('download', 'classified_students.csv');
document.body.appendChild(link); link.click(); link.remove();
})
}


return (
<div style={{ fontFamily: 'Inter, Arial', padding: 24, maxWidth: 1100, margin: '0 auto' }}>
<h1 style={{ fontSize: 28, marginBottom: 8 }}>Dropout Predictor — Institution Dashboard</h1>
<section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12 }}>
<h2>Upload student CSV</h2>
<input type="file" accept=".csv" onChange={onFile} />
<button onClick={upload} style={{ marginLeft: 8 }}>Upload & Classify</button>
<button onClick={exportCSV} style={{ marginLeft: 8 }}>Export CSV</button>
</section>


<section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12 }}>
<h2>Counselling Scheduler</h2>
<label>Teacher name: <input value={teacherName} onChange={e => setTeacherName(e.target.value)} /></label>
<br />
<label>Date: <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} /></label>
<label style={{ marginLeft: 8 }}>Time: <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} /></label>
<div style={{ marginTop: 8 }}>
