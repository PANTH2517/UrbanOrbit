import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog.jsx";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Camera, Upload, MapPin, X, LocateFixed, AlertCircle, CheckCircle } from "lucide-react";
import { UploadFile } from "../../../integrations/Core.jsx";
import { problemTypes } from "../problems/ProblemSelector";
import { Alert, AlertDescription } from "../ui/alert";
import { useToast } from "../ui/Toast";

export default function ReportIssueDialog({
  isOpen,
  onClose,
  onSubmit,
  clickMarker = null
}) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    problem_type: '',
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    image_url: '',
    location_link: ''
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
        // Reset form when dialog opens
        setFormData({
            problem_type: '',
            title: '',
            description: '',
            latitude: clickMarker?.lat || '',
            longitude: clickMarker?.lng || '',
            address: '',
            image_url: '',
            location_link: ''
        });
        setUploadedImage(null);
        setLocationStatus(clickMarker ? 'set_by_click' : 'idle');
        setUploadError(null);
        setUploadSuccess(false);
    }
  }, [isOpen, clickMarker]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleShareLocation = () => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setLocationStatus('success');
        },
        () => {
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      console.log('Uploading file:', file.name, file.size);
      const result = await UploadFile({ file });
      console.log('Upload result:', result);
      
      if (result && result.file_url) {
        setFormData(prev => ({
          ...prev,
          image_url: result.file_url
        }));
        setUploadedImage(result.file_url);
        setUploadSuccess(true);
        console.log('Image uploaded successfully:', result.file_url);
      } else {
        throw new Error('Upload failed - no file URL returned');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Image upload failed. You can still submit without a photo.');
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.problem_type) {
      showToast('Please select a problem type', 'warning');
      return;
    }

    if (!formData.title) {
      showToast('Please enter an issue title', 'warning');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setLocationStatus('required');
      showToast('Location is required. Please set it by using live location or clicking the map.', 'warning');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Add ward number based on location (simplified for demo)
      const wardNumber = `Ward-${Math.floor(Math.random() * 20 + 1)}`;
      
      const submissionData = {
        ...formData,
        ward_number: wardNumber,
        // Convert to numbers
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };
      
      console.log('Submitting issue:', submissionData);
      await onSubmit(submissionData);
      console.log('Issue submitted successfully');

    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('Failed to submit report. Please try again.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Report Urban Issue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="problem_type">Problem Type *</Label>
            <Select
              value={formData.problem_type}
              onValueChange={(value) => handleInputChange('problem_type', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select problem type" />
              </SelectTrigger>
              <SelectContent>
                {problemTypes.map((problem) => (
                  <SelectItem key={problem.id} value={problem.id}>
                    <div className="flex items-center gap-2">
                      <span>{problem.icon}</span>
                      <span>{problem.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide more details about the issue..."
              className="h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="border-2 border-dashed border-white/15 rounded-lg p-4 space-y-3">
                <div>
                    <p className="text-sm text-slate-400 mb-2">
                        Set location by clicking the map or using your current location.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleShareLocation}
                        disabled={locationStatus === 'loading'}
                    >
                        {locationStatus === 'loading' ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2" />
                            Getting Location...
                        </>
                        ) : (
                        <>
                            <LocateFixed className="w-4 h-4 mr-2" />
                            Use My Current Location
                        </>
                        )}
                    </Button>
                </div>

                {locationStatus === 'set_by_click' && formData.latitude && (
                  <div className="flex items-center gap-2 text-cyan-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Location set from map click</span>
                  </div>
                )}
                {locationStatus === 'success' && formData.latitude && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Current location captured successfully</span>
                  </div>
                )}
                {locationStatus === 'error' && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Could not get location. Please enable location permissions or click on the map.
                    </AlertDescription>
                  </Alert>
                )}
                {locationStatus === 'required' && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Location is required. Please set it using one of the options above.</AlertDescription>
                    </Alert>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address / Landmark</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="e.g., Near Pune Station, MG Road"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_link">Google Maps Link (Optional)</Label>
            <Input
              id="location_link"
              type="url"
              value={formData.location_link}
              onChange={(e) => handleInputChange('location_link', e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label>Photo Evidence (Optional but Recommended)</Label>
            <div className="border-2 border-dashed border-white/15 rounded-lg p-4">
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded evidence"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => {
                      setUploadedImage(null);
                      setUploadSuccess(false);
                      setFormData(prev => ({ ...prev, image_url: '' }));
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  {uploadSuccess && (
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-2">
                    Add a photo to help document the issue
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Photo
                      </>
                    )}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            {uploadError && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}
            {uploadSuccess && !uploadedImage && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm mt-2">
                <CheckCircle className="w-4 h-4" />
                <span>Photo uploaded successfully!</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}