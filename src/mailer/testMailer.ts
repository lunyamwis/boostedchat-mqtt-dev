/*
* You can run this script to test if the emails are being properly sent
* Here's how to run it:
* npx tsx --env-file=.env   src/mailer/testMailer.ts 
* Make sure to change the path to this script to match it's location
*/

import { Mailer } from './mailer';

async function testSend() {
  const mailer = new Mailer();
  try {
    const result = await mailer.send({
      subject: 'Test Email',
      text: 'This is a test email sent from the terminal.',
    });
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testSend();