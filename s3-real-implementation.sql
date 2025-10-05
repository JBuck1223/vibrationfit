-- Real S3 Storage RPC Functions for VibrationFit
-- This implementation uses Supabase's AWS extension to actually upload to S3

-- First, enable the AWS extension (run this first)
-- CREATE EXTENSION IF NOT EXISTS aws_extension;

-- Function to upload file to S3
CREATE OR REPLACE FUNCTION upload_to_s3(
  file_path TEXT,
  file_data TEXT, -- base64 encoded file data
  content_type TEXT,
  bucket_name TEXT DEFAULT 'vibration-fit-client-storage'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  decoded_data BYTEA;
BEGIN
  -- Decode base64 data to binary
  decoded_data := decode(file_data, 'base64');
  
  -- Upload to S3 using AWS extension
  -- Note: You'll need to configure AWS credentials in Supabase
  PERFORM aws_s3.put_object(
    bucket_name,
    file_path,
    decoded_data,
    content_type
  );
  
  result := json_build_object(
    'success', true,
    'message', 'File uploaded successfully to S3',
    'path', file_path,
    'bucket', bucket_name,
    'url', 'https://' || bucket_name || '.s3.amazonaws.com/' || file_path
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', 'Upload failed: ' || SQLERRM,
      'path', file_path,
      'bucket', bucket_name
    );
    RETURN result;
END;
$$;

-- Function to delete file from S3
CREATE OR REPLACE FUNCTION delete_from_s3(
  file_path TEXT,
  bucket_name TEXT DEFAULT 'vibration-fit-client-storage'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Delete from S3 using AWS extension
  PERFORM aws_s3.delete_object(
    bucket_name,
    file_path
  );
  
  result := json_build_object(
    'success', true,
    'message', 'File deleted successfully from S3',
    'path', file_path,
    'bucket', bucket_name
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', 'Delete failed: ' || SQLERRM,
      'path', file_path,
      'bucket', bucket_name
    );
    RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION upload_to_s3(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_from_s3(TEXT, TEXT) TO authenticated;

-- Note: To make this work, you need to:
-- 1. Enable the AWS extension in Supabase: CREATE EXTENSION IF NOT EXISTS aws_extension;
-- 2. Configure AWS credentials in Supabase dashboard under Settings > Integrations > AWS
-- 3. Set up the S3 bucket with proper permissions
-- 4. Configure CloudFront distribution for the CDN URLs
