
import React from 'react';
import { UploadCloudIcon } from 'lucide-react';

interface CVUploadProps {
  cvFile: File | null;
  isExtractingInfo: boolean;
  extractionProgress: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CVUpload: React.FC<CVUploadProps> = ({
  cvFile,
  isExtractingInfo,
  extractionProgress,
  onFileChange,
}) => {
  return (
    <div className="space-y-2">
      <div 
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-all ${isExtractingInfo ? 'bg-gray-50' : ''}`} 
        onClick={() => document.getElementById('cv')?.click()}
      >
        <UploadCloudIcon className="mx-auto mb-4 h-10 w-10 text-gray-400" />
        <div className="text-sm mb-2 text-gray-500">
          {cvFile ? cvFile.name : "Cliquez pour sélectionner un fichier"}
        </div>
        <input
          id="cv"
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={onFileChange}
        />
        {isExtractingInfo && (
          <div className="mt-2">
            <p className="text-sm text-blue-600">Analyse du CV en cours... {extractionProgress}%</p>
            <div className="w-full mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${extractionProgress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {extractionProgress < 30 && "Lecture du document..."}
              {extractionProgress >= 30 && extractionProgress < 60 && "Extraction des informations personnelles..."}
              {extractionProgress >= 60 && extractionProgress < 90 && "Identification des compétences..."}
              {extractionProgress >= 90 && "Détermination du niveau d'expertise..."}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Formats acceptés : PDF, DOC, DOCX
      </p>
    </div>
  );
};
