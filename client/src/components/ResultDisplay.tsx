import { Trophy, Download, Share, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResultData } from '@/types/result';

interface ResultDisplayProps {
  isVisible: boolean;
  resultData: ResultData | null;
}

export default function ResultDisplay({ isVisible, resultData }: ResultDisplayProps) {
  console.log('[ResultDisplay] Props:', { isVisible, resultData });
  
  if (!isVisible || !resultData) {
    console.log('[ResultDisplay] Not rendering - isVisible:', isVisible, 'resultData:', resultData);
    return null;
  }

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    console.log('Download PDF functionality');
  };

  const handleShareResult = () => {
    // TODO: Implement result sharing
    console.log('Share result functionality');
  };

  const handlePrintResult = () => {
    window.print();
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Trophy className="w-6 h-6 mr-3" />
            Examination Result
          </h3>
        </div>

        <div className="p-6">
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Student Name:</span>
                <span className="font-medium">{resultData.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Father's Name:</span>
                <span className="font-medium">{resultData.fatherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mother's Name:</span>
                <span className="font-medium">{resultData.motherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Roll Number:</span>
                <span className="font-medium">{resultData.roll}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Registration:</span>
                <span className="font-medium">{resultData.registration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Institution:</span>
                <span className="font-medium">{resultData.institution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Group:</span>
                <span className="font-medium">{resultData.group}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Session:</span>
                <span className="font-medium">{resultData.session}</span>
              </div>
            </div>
          </div>

          {/* Result Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-green-600">
                  Result: {resultData.result}
                </p>
                <p className="text-gray-600">Grade Point Average</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{resultData.gpa}</p>
                <p className="text-lg font-medium text-green-600">{resultData.grade}</p>
              </div>
            </div>
          </div>

          {/* Subject Marks */}
          {resultData.subjects && resultData.subjects.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Subject</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Marks</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Grade</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resultData.subjects.map((subject, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-medium">{subject.name}</td>
                      <td className="px-4 py-3 text-center">{subject.marks}</td>
                      <td className="px-4 py-3 text-center">{subject.grade}</td>
                      <td className="px-4 py-3 text-center">{subject.gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button onClick={handleDownloadPDF} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleShareResult} className="flex-1 bg-green-600 hover:bg-green-700">
              <Share className="w-4 h-4 mr-2" />
              Share Result
            </Button>
            <Button onClick={handlePrintResult} className="flex-1 bg-gray-600 hover:bg-gray-700">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
