
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiagnosticFormProps {
  urlToTest: string;
  setUrlToTest: (url: string) => void;
  runDiagnostics: () => void;
  isRunningTests: boolean;
}

const DiagnosticForm: React.FC<DiagnosticFormProps> = ({
  urlToTest,
  setUrlToTest,
  runDiagnostics,
  isRunningTests
}) => {
  return (
    <div className="flex space-x-2">
      <Input
        placeholder="URL para testar (ex: /api/health)"
        value={urlToTest}
        onChange={(e) => setUrlToTest(e.target.value)}
      />
      <Button 
        onClick={runDiagnostics}
        disabled={isRunningTests}
        variant="outline"
      >
        {isRunningTests ? 'Testando...' : 'Testar'}
      </Button>
    </div>
  );
};

export default DiagnosticForm;
