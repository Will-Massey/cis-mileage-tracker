/**
 * Receipt Capture Component
 * Camera integration for capturing fuel and material receipts
 * With OCR for automatic data extraction
 */

import React, { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import SQLiteService from '../services/SQLiteService';

const ReceiptCapture = ({ tripId, onReceiptSaved }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState({
    description: '',
    amount: '',
    category: 'fuel',
    merchant: '',
    date: new Date().toISOString().split('T')[0]
  });
  const sqlite = useRef(new SQLiteService());

  const categories = [
    { value: 'fuel', label: 'Fuel', icon: '⛽' },
    { value: 'materials', label: 'Materials', icon: '🔧' },
    { value: 'tools', label: 'Tools/Equipment', icon: '🛠️' },
    { value: 'ppe', label: 'Safety/PPE', icon: '⛑️' },
    { value: 'parking', label: 'Parking/Tolls', icon: '🅿️' },
    { value: 'other', label: 'Other', icon: '📄' }
  ];

  const takePhoto = async () => {
    try {
      setIsCapturing(true);
      
      // Request camera permission and take photo
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'Capture Receipt',
        promptLabelPhoto: 'Take Photo',
        promptLabelPicture: 'Choose from Gallery'
      });

      if (image.dataUrl) {
        setPreview(image.dataUrl);
        
        // Try OCR
        await performOCR(image.dataUrl);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      if (error.message !== 'User cancelled photos app') {
        alert('Error accessing camera. Please check permissions.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const performOCR = async (imageData) => {
    setIsProcessing(true);
    try {
      // Call Google Vision API for OCR
      const { value: apiKey } = await Preferences.get({ key: 'google_vision_api_key' });
      
      if (!apiKey) {
        console.log('No API key for OCR, skipping...');
        return;
      }

      // Remove data URL prefix
      const base64Image = imageData.split(',')[1];

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64Image },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'DOCUMENT_TEXT_DETECTION' }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      
      if (data.responses && data.responses[0].fullTextAnnotation) {
        const text = data.responses[0].fullTextAnnotation.text;
        
        // Extract amount using regex
        const amountMatch = text.match(/£?\s*(\d+\.\d{2})/);
        if (amountMatch) {
          setReceiptData(prev => ({ ...prev, amount: amountMatch[1] }));
        }

        // Try to extract merchant name (usually at top of receipt)
        const lines = text.split('\n');
        if (lines.length > 0) {
          setReceiptData(prev => ({ ...prev, merchant: lines[0].trim() }));
        }

        // Try to extract date
        const dateMatch = text.match(/(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4})/);
        if (dateMatch) {
          // Parse and format date
          const parsedDate = parseDate(dateMatch[1]);
          if (parsedDate) {
            setReceiptData(prev => ({ ...prev, date: parsedDate }));
          }
        }
      }
    } catch (error) {
      console.error('OCR error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseDate = (dateStr) => {
    try {
      const parts = dateStr.split(/[\/\.]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${month}-${day}`;
      }
    } catch {
      return null;
    }
  };

  const saveReceipt = async () => {
    try {
      await sqlite.current.initialize();
      
      const userId = await Preferences.get({ key: 'user_id' });
      
      const receipt = {
        id: `receipt_${Date.now()}`,
        userId: userId.value || 'local_user',
        tripId,
        filename: `receipt_${Date.now()}.jpg`,
        localPath: preview,
        storageKey: null, // Will be set after cloud upload
        fileType: 'image/jpeg',
        fileSize: preview ? Math.round(preview.length * 0.75) : 0, // Approximate
        description: receiptData.description,
        amount: parseFloat(receiptData.amount) || 0,
        merchant: receiptData.merchant,
        receiptDate: receiptData.date,
        category: receiptData.category,
        ocrData: null,
        isSynced: false
      };

      await sqlite.current.saveReceipt(receipt);
      
      onReceiptSaved?.(receipt);
      
      // Reset
      setPreview(null);
      setReceiptData({
        description: '',
        amount: '',
        category: 'fuel',
        merchant: '',
        date: new Date().toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Error saving receipt. Please try again.');
    }
  };

  const cancelCapture = () => {
    setPreview(null);
    setReceiptData({
      description: '',
      amount: '',
      category: 'fuel',
      merchant: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  if (preview) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Preview */}
        <div className="relative">
          <img 
            src={preview} 
            alt="Receipt preview" 
            className="w-full h-64 object-cover"
          />
          <button
            onClick={cancelCapture}
            className="absolute top-3 right-3 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {isProcessing && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-xl">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Reading receipt...</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (£)</label>
            <input
              type="number"
              step="0.01"
              value={receiptData.amount}
              onChange={(e) => setReceiptData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setReceiptData(prev => ({ ...prev, category: cat.value }))}
                  className={`
                    p-3 rounded-xl text-center transition-all
                    ${receiptData.category === cat.value 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <p className="text-xs mt-1 font-medium">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Merchant</label>
            <input
              type="text"
              value={receiptData.merchant}
              onChange={(e) => setReceiptData(prev => ({ ...prev, merchant: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Tesco, Shell"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={receiptData.date}
              onChange={(e) => setReceiptData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea
              value={receiptData.description}
              onChange={(e) => setReceiptData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="e.g., Fuel for site visit"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={saveReceipt}
            disabled={!receiptData.amount}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
          >
            Save Receipt
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={takePhoto}
      disabled={isCapturing}
      className="w-full py-6 bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors"
    >
      {isCapturing ? (
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-gray-600 font-medium">Capture Receipt</span>
          <span className="text-sm text-gray-400">Fuel, materials, tools, etc.</span>
        </>
      )}
    </button>
  );
};

export default ReceiptCapture;
