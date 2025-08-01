import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend only if API key is available
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, category } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    if (!resend) {
      console.log('⚠️ Resend API key not configured, email service unavailable');
      return NextResponse.json(
        { 
          error: 'Email service is currently unavailable. Please contact us directly at support@pixelpharm.com.',
          details: 'RESEND_API_KEY not configured'
        },
        { status: 503 }
      );
    }

    // Send email to support
    const emailData = await resend.emails.send({
      from: 'PixelPharm Support <support@pixelpharm.com>',
      to: ['support@pixelpharm.com'],
      subject: `Support Request: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            New Support Request
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Contact Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Category:</strong> ${category || 'General'}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">Subject</h3>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px;">${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">Message</h3>
            <div style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; white-space: pre-wrap;">${message}</div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>This email was sent from the PixelPharm support form at ${new Date().toLocaleString()}.</p>
          </div>
        </div>
      `,
    });

    console.log('✅ Support email sent successfully:', emailData);

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you within 24 hours.',
    });

  } catch (error: any) {
    console.error('❌ Error sending support email:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send message. Please try again or contact us directly at support@pixelpharm.com.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}