import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, DOCUMENT_TYPES, VERIFICATION_STATUS } from '../../constants';
import { providerService } from '../../services/api';

const DocumentUpload = ({ navigation }) => {
  const [documents, setDocuments] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});

  const documentTypes = [
    {
      type: DOCUMENT_TYPES.ID_DOCUMENT,
      title: 'ID Document',
      description: 'Copy of your South African ID or passport',
      icon: '🆔',
      required: true,
    },
    {
      type: DOCUMENT_TYPES.PROOF_OF_ADDRESS,
      title: 'Proof of Address',
      description: 'Utility bill or bank statement (not older than 3 months)',
      icon: '🏠',
      required: true,
    },
    {
      type: DOCUMENT_TYPES.BANK_STATEMENT,
      title: 'Bank Statement',
      description: 'Recent bank statement for payment verification',
      icon: '🏦',
      required: true,
    },
    {
      type: DOCUMENT_TYPES.CRIMINAL_RECORD,
      title: 'Criminal Background Check',
      description: 'Police clearance certificate',
      icon: '🔍',
      required: true,
    },
    {
      type: DOCUMENT_TYPES.REFERENCES,
      title: 'References',
      description: 'Contact details of 2 references (optional)',
      icon: '👥',
      required: false,
    },
  ];

  const handleDocumentPick = async (documentType) => {
    Alert.alert(
      'Select Document',
      'Choose how you want to provide your document',
      [
        {
          text: 'Take Photo',
          onPress: () => openCamera(documentType),
        },
        {
          text: 'Choose from Files',
          onPress: () => openDocumentPicker(documentType),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = (documentType) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setDocuments(prev => ({
          ...prev,
          [documentType]: {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || `${documentType}.jpg`,
          },
        }));
      }
    });
  };

  const openDocumentPicker = async (documentType) => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });

      if (result && result[0]) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: result[0],
        }));
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const removeDocument = (documentType) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[documentType];
      return newDocs;
    });
  };

  const validateDocuments = () => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !documents[doc.type]);

    if (missingDocs.length > 0) {
      Alert.alert(
        'Missing Documents',
        `Please upload the following required documents:\n${missingDocs.map(doc => `• ${doc.title}`).join('\n')}`
      );
      return false;
    }

    return true;
  };

  const handleSubmitDocuments = async () => {
    if (!validateDocuments()) {
      return;
    }

    setIsUploading(true);

    try {
      await providerService.uploadDocuments(documents);
      
      Alert.alert(
        'Documents Submitted',
        'Your documents have been submitted for verification. We will review them within 24-48 hours and notify you once approved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentStatus = (documentType) => {
    return documents[documentType] ? 'uploaded' : 'pending';
  };

  const renderDocumentCard = (doc) => {
    const hasDocument = documents[doc.type];
    const status = getDocumentStatus(doc.type);

    return (
      <View key={doc.type} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentIcon}>{doc.icon}</Text>
            <View style={styles.documentDetails}>
              <Text style={styles.documentTitle}>
                {doc.title}
                {doc.required && <Text style={styles.required}> *</Text>}
              </Text>
              <Text style={styles.documentDescription}>{doc.description}</Text>
            </View>
          </View>
          
          <View style={[
            styles.statusBadge,
            status === 'uploaded' && styles.statusBadgeUploaded
          ]}>
            <Text style={[
              styles.statusText,
              status === 'uploaded' && styles.statusTextUploaded
            ]}>
              {status === 'uploaded' ? '✓' : '○'}
            </Text>
          </View>
        </View>

        {hasDocument ? (
          <View style={styles.uploadedDocument}>
            <View style={styles.documentPreview}>
              <Text style={styles.documentName}>{hasDocument.name}</Text>
              <Text style={styles.documentSize}>
                {hasDocument.size ? `${(hasDocument.size / 1024 / 1024).toFixed(2)} MB` : 'Image'}
              </Text>
            </View>
            
            <View style={styles.documentActions}>
              <TouchableOpacity
                style={styles.replaceButton}
                onPress={() => handleDocumentPick(doc.type)}
              >
                <Text style={styles.replaceButtonText}>Replace</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeDocument(doc.type)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleDocumentPick(doc.type)}
          >
            <Text style={styles.uploadIcon}>📎</Text>
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const requiredDocsCount = documentTypes.filter(doc => doc.required).length;
  const uploadedRequiredCount = documentTypes.filter(doc => doc.required && documents[doc.type]).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Document Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Verification Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(uploadedRequiredCount / requiredDocsCount) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {uploadedRequiredCount} of {requiredDocsCount} required documents uploaded
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instruction}>• Upload clear, readable documents</Text>
            <Text style={styles.instruction}>• All information must be visible</Text>
            <Text style={styles.instruction}>• Documents should not be older than 3 months (where applicable)</Text>
            <Text style={styles.instruction}>• Accepted formats: JPG, PNG, PDF</Text>
          </View>
        </View>

        {/* Document Cards */}
        <View style={styles.documentsSection}>
          <Text style={styles.documentsTitle}>Required Documents</Text>
          {documentTypes.map(renderDocumentCard)}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityIcon}>🔒</Text>
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Your Privacy is Protected</Text>
            <Text style={styles.securityText}>
              All documents are encrypted and stored securely. They are only used for verification purposes and will not be shared with third parties.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            uploadedRequiredCount < requiredDocsCount && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitDocuments}
          disabled={isUploading || uploadedRequiredCount < requiredDocsCount}
        >
          {isUploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit for Verification
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.text.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  instructionsSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  instructionsList: {
    gap: 4,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  documentsSection: {
    marginBottom: 24,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  documentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  required: {
    color: COLORS.danger,
  },
  documentDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  statusBadgeUploaded: {
    backgroundColor: COLORS.secondary,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statusTextUploaded: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  uploadedDocument: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  documentPreview: {
    marginBottom: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  replaceButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  replaceButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    marginBottom: 100,
    padding: 16,
    borderRadius: 12,
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  footer: {
    padding: 24,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentUpload;