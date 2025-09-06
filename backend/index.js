// Minimal Express backend to accept CSV, classify and send emails
if (isAttendanceLow && isFeesSevere) return 'red';
if (isAttendanceLow || unpaid >= RULES.fees_months_yellow || has_issue) return 'yellow';
return 'green';
}


app.post('/api/upload-csv', upload.single('file'), (req, res) => {
if (!req.file) return res.status(400).json({ error: 'No file uploaded' });


const content = fs.readFileSync(req.file.path);
csv(content, { columns: true, trim: true }, (err, records) => {
fs.unlinkSync(req.file.path);
if (err) return res.status(500).json({ error: 'CSV parse error', details: err.message });


// classify
const classified = records.map(r => ({ ...r, category: classifyStudent(r) }));
return res.json({ data: classified });
});
});


// Export categorized CSV
app.post('/api/export', (req, res) => {
const { rows } = req.body;
if (!rows) return res.status(400).send('Missing rows');
const csvOut = stringify(rows, { header: true });
res.setHeader('Content-disposition', 'attachment; filename=classified_students.csv');
res.set('Content-Type', 'text/csv');
res.status(200).send(csvOut);
});


// Send emails to a list of students (simple)
app.post('/api/send-emails', async (req, res) => {
const { recipients, teacherName, scheduleDate, scheduleTime } = req.body;
if (!recipients || !Array.isArray(recipients)) return res.status(400).json({ error: 'recipients required' });


// configure transporter
const transporter = nodemailer.createTransport({
host: process.env.SMTP_HOST,
port: Number(process.env.SMTP_PORT) || 587,
secure: process.env.SMTP_SECURE === 'true',
auth: {
user: process.env.SMTP_USER,
pass: process.env.SMTP_PASS
}
});


const results = [];
for (const r of recipients) {
const mailOptions = {
from: process.env.EMAIL_FROM || process.env.SMTP_USER,
to: r.email || r.name + '@example.com', // fallback email
subject: `Counselling Session Invitation - ${teacherName}`,
text: `Hello ${r.name},\n\nYou are requested to attend a counselling session on ${scheduleDate} at ${scheduleTime}. Please contact ${teacherName} for more details.\n\nRegards,\n${teacherName}`
};


try {
await transporter.sendMail(mailOptions);
results.push({ to: mailOptions.to, status: 'sent' });
} catch (e) {
results.push({ to: mailOptions.to, status: 'error', error: e.message });
}
}


res.json({ results });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Backend listening on', PORT));
