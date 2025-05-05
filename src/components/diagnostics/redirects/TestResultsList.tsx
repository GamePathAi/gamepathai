
import React from 'react';
import RedirectTestResult, { RedirectTest } from './RedirectTestResult';

interface TestResultsListProps {
  results: RedirectTest[];
  isRunningTests: boolean;
  diagnoseComplete: boolean;
}

const TestResultsList: React.FC<TestResultsListProps> = ({ 
  results, 
  isRunningTests,
  diagnoseComplete
}) => {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Resultados dos testes:</h3>
      
      <div className="space-y-2">
        {results.map((result, index) => (
          <RedirectTestResult key={index} result={result} />
        ))}
        
        {results.length === 0 && !isRunningTests && diagnoseComplete && (
          <div className="text-center py-2 text-gray-500 text-sm">
            Nenhum teste realizado
          </div>
        )}
        
        {isRunningTests && (
          <div className="text-center py-2 text-gray-500 text-sm">
            Executando testes...
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResultsList;
