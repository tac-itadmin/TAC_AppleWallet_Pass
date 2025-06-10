const express = require('express');
const router = express.Router();
const { PKPass } = require('passkit-generator');
const fs = require('fs');
const path = require('path');

router.post('/generate-pass', async (req, res) => {
    const { memberId, memberName, email, qrCodeLink } = req.body;
   
    if (!memberId || !memberName) {
        return res.status(400).json({ error: 'Member ID and Name are required' });
    }
   
    try {
        const buffer = await generatePass(memberId, memberName, email, qrCodeLink);
       
        res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        res.setHeader('Content-Disposition', `attachment; filename=event-ticket.pkpass`);
        res.send(buffer);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate pass' });
    }
});

function loadCertificates() {
    try {
        return {
            wwdr: fs.readFileSync(path.join(__dirname, 'certs/wwdr.pem')),
            signerCert: fs.readFileSync(path.join(__dirname, 'certs/signerCert.pem')),
            signerKey: fs.readFileSync(path.join(__dirname, 'certs/signerKey.pem')),
            signerKeyPassphrase: 'test'
        };
    } catch (error) {
        console.error('Error loading certificates:', error);
        throw error;
    }
}

async function generatePass(memberId, memberName, email, qrCodeLink) {
    try {
        const certificates = loadCertificates();
        const passJson = {
            formatVersion: 1,
            passTypeIdentifier: "pass.com.sourabh.passmaker",
            teamIdentifier: "2P74G6D53T",
            organizationName: "The Arts Club",
            description: "Event Ticket",
            serialNumber: `TICKET${Date.now()}`,
            backgroundColor: "rgb(69, 31, 31)",
            foregroundColor: "rgb(255, 255, 255)",
            labelColor: "rgb(255, 255, 255)",
            nfc: {
                message: "Member ID: " + memberId,
                encryptionPublicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEroR4ZpIUfdyoVgyz+Eu7ZbTknFqqcBzVnNDDYEqbjwTQrnlRo45yG/w6/Ekgrkn3RaLDbiY/94nR8aq6bauKXA==",
                requiresAuthentication: true
            },
            eventTicket: {
                headerFields: [
                    {
                        key: "Id",
                        label: "Id",
                        value: memberId
                    }
                ],
                primaryFields: [
                    {
                        key: "Member",
                        label: "Member",
                        value: memberName
                    }
                ],
            
            }
        };

        const pass = new PKPass(
            {
                'icon.png': fs.readFileSync(path.join(__dirname, 'images/event-ticket.pass/icon.png')),
                'icon@2x.png': fs.readFileSync(path.join(__dirname, 'images/event-ticket.pass/icon@2x.png')),
                'logo.png': fs.readFileSync(path.join(__dirname, 'images/event-ticket.pass/TacLogo3.png')),
                'logo@2x.png': fs.readFileSync(path.join(__dirname, 'images/event-ticket.pass/TacLogo4.png')),
                'pass.json': Buffer.from(JSON.stringify(passJson)),
                'en.lproj/pass.strings': Buffer.from(`
                    "EVENT" = "Event";
                    "LOCATION" = "Location";
                    "DATE" = "Date";
                    "EMAIL" = "Email";
                `)
            },
            certificates,
            {
                serialNumber: `TICKET${Date.now()}`
            }
        );

        // Use the provided QR code link or fall back to a default
        const barcodeMessage = qrCodeLink || "https://theartsclub--tacuat.sandbox.lightning.force.com/lightning/page/home";
        
        pass.setBarcodes({
            message: barcodeMessage,
            format: "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1"
        });

        return pass.getAsBuffer();
    } catch (error) {
        console.error('Error generating pass:', error);
        throw error;
    }
}

module.exports = router;