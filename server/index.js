import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Configuration CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Pour le développement local
    'https://planning-app-r9z1.onrender.com', // Frontend sur Render
    'https://planning-server.onrender.com' // Le backend lui-même
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.orange.fr',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'mtz.trading@orange.fr',
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// Vérifier la configuration SMTP
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erreur de configuration SMTP:', error);
  } else {
    console.log('Serveur SMTP prêt');
  }
});

app.post('/send-planning', async (req, res) => {
  console.log('Réception d\'une requête d\'envoi de planning');
  const { pdfBuffer, employees, weekStartDate, isMonthly, subject, emailContent, month, year, customEmail } = req.body;
  
  try {
    console.log('Nombre d\'employés reçus:', employees.length);
    console.log('Employés avec email:', employees.filter(e => e.email).length);
    console.log('Type de planning:', isMonthly ? 'Mensuel' : 'Hebdomadaire');
    
    let emailSubject = '';
    let emailText = '';
    let filename = '';
    
    // Si c'est un planning mensuel et que nous avons des informations personnalisées
    if (isMonthly && customEmail && subject && emailContent) {
      console.log('Utilisation des informations personnalisées pour l\'email');
      emailSubject = subject;
      emailText = (employee) => `Bonjour ${employee.name},\n\n${emailContent}\n\nCordialement,`;
      filename = `planning_mensuel_${month ? month.toLowerCase() : ''}_${year || ''}.pdf`;
    } else {
      // Format hebdomadaire par défaut
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const startDateStr = weekStart.toLocaleDateString('fr-FR');
      const endDateStr = weekEnd.toLocaleDateString('fr-FR');
      
      console.log('Période:', startDateStr, 'au', endDateStr);
      
      emailSubject = `Planning du ${startDateStr} au ${endDateStr}`;
      emailText = (employee) => `Bonjour ${employee.name},\n\nVeuillez trouver ci-joint votre planning pour la semaine du ${startDateStr} au ${endDateStr}.\n\nCordialement,`;
      filename = `planning_${startDateStr}_${endDateStr}.pdf`;
    }
    
    console.log('Objet de l\'email:', emailSubject);
    console.log('Taille du PDF:', pdfBuffer.length);

    // Convertir le tableau en Buffer
    const pdfData = Buffer.from(pdfBuffer);

    const emailPromises = employees
      .filter(employee => employee.email)
      .map(async (employee) => {
        console.log('Tentative d\'envoi à:', employee.email);
        
        const mailOptions = {
          from: 'mtz.trading@orange.fr',
          to: employee.email,
          subject: emailSubject,
          text: typeof emailText === 'function' ? emailText(employee) : emailText,
          attachments: [{
            filename: filename,
            content: pdfData
          }]
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log('Email envoyé avec succès à', employee.email, 'ID:', info.messageId);
          return { success: true, employee };
        } catch (error) {
          console.error(`Erreur détaillée lors de l'envoi du mail à ${employee.email}:`, error);
          return { success: false, employee, error: error.message };
        }
      });

    const results = await Promise.all(emailPromises);
    console.log('Résultats des envois:', results);
    res.json(results);
  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi des emails:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
