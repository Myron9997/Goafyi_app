import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Use anonymous client for onboarding submissions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const formData = await request.formData();
    
    // Extract form data with validation
    const businessName = formData.get('businessName') as string;
    const categoriesString = formData.get('categories') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const fullAddress = formData.get('fullAddress') as string;
    const website = formData.get('website') as string;
    const description = formData.get('description') as string;

    // Validate required fields
    if (!businessName || !email || !phone || !fullAddress) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse categories safely
    let categories: string[] = [];
    try {
      categories = categoriesString ? JSON.parse(categoriesString) : [];
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid categories format' },
        { status: 400 }
      );
    }

    // Check if email already exists in onboarding applications
    try {
      const { data: existingApplication, error: appError } = await supabase
        .from('vendor_onboarding_applications')
        .select('id')
        .eq('email', email)
        .single();

      if (appError && appError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing application:', appError);
        return NextResponse.json(
          { message: 'Database error. Please try again.' },
          { status: 500 }
        );
      }

      if (existingApplication) {
        return NextResponse.json(
          { message: 'An application with this email already exists.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing application:', error);
      return NextResponse.json(
        { message: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // Check if email already exists in users table
    try {
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing user:', userError);
        return NextResponse.json(
          { message: 'Database error. Please try again.' },
          { status: 500 }
        );
      }

      if (existingUser) {
        return NextResponse.json(
          { message: 'This email is already registered. Please use the login page.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
      return NextResponse.json(
        { message: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // Handle file uploads to Supabase Storage
    const fssaiLicense = formData.get('fssaiLicense') as File | null;
    const businessLicense = formData.get('businessLicense') as File | null;
    const gstCertificate = formData.get('gstCertificate') as File | null;
    
    // Get other documents
    const otherDocuments: File[] = [];
    let index = 0;
    while (formData.get(`otherDocument_${index}`)) {
      const file = formData.get(`otherDocument_${index}`) as File;
      otherDocuments.push(file);
      index++;
    }

    // Insert the onboarding application first
    const { data, error } = await supabase
      .from('vendor_onboarding_applications')
      .insert({
        business_name: businessName,
        categories: categories,
        email: email,
        phone: phone,
        full_address: fullAddress,
        website: website || null,
        description: description || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { message: `Failed to submit application: ${error.message}` },
        { status: 500 }
      );
    }

    const applicationId = data.id;

    // For now, just store file names (we'll implement storage later)
    const documentPaths = {
      fssai_license: fssaiLicense ? fssaiLicense.name : null,
      business_license: businessLicense ? businessLicense.name : null,
      gst_certificate: gstCertificate ? gstCertificate.name : null,
      other_documents: otherDocuments.length > 0 ? otherDocuments.map(file => file.name) : null
    };

    // Update application with file names
    try {
      await supabase
        .from('vendor_onboarding_applications')
        .update(documentPaths)
        .eq('id', applicationId);
    } catch (updateError) {
      console.error('Error updating application with file names:', updateError);
      // Don't fail the request, application is already created
    }

    // TODO: Send notification email to admin about new application

    return NextResponse.json(
      { message: 'Application submitted successfully!', applicationId: data.id },
      { status: 200 }
    );

  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}