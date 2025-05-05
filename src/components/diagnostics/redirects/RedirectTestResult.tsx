
import React from 'react';
import { AlertCircle, CheckCircle } from "lucide-react";

export interface RedirectTest {
  url: string;
  redirected: boolean;
  target?: string;
  isGamePathAI?: boolean;
  status?: number;
}

interface RedirectTestResultProps {
  result: RedirectTest;
}

const RedirectTestResult: React.FC<RedirectTestResultProps> = ({ result }) => {
  return (
    <div className="text-xs border rounded-md p-2">
      <div className="flex justify-between mb-1">
        <span className="font-medium">{result.url}</span>
        <span className={result.redirected ? 
          (result.isGamePathAI ? "text-red-500" : "text-amber-500") : 
          "text-green-500"}
        >
          {result.redirected ? 
            (result.isGamePathAI ? "Redirecionado (gamepathai.com)" : "Redirecionado") : 
            "Sem redirecionamento"}
        </span>
      </div>
      {result.redirected && (
        <div className="text-gray-400">
          Destino: {result.target}
        </div>
      )}
      {result.status && (
        <div className="text-gray-400">
          Status: {result.status}
        </div>
      )}
    </div>
  );
};

export default RedirectTestResult;
