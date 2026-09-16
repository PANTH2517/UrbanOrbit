
import React from 'react';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";


const problemTypes = [
  { 
    id: 'slum_watch', 
    label: 'Slum Watch', 
    icon: '🏘️',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Unauthorized settlements and housing issues'
  },
  { 
    id: 'urban_heat_islands', 
    label: 'Heat Islands', 
    icon: '🌡️',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Temperature hotspots in urban areas'
  },
  { 
    id: 'pollution_zones', 
    label: 'Pollution Zones', 
    icon: '🏭',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Air, water, and noise pollution areas'
  },
  { 
    id: 'disaster_chaos', 
    label: 'Disaster Areas', 
    icon: '⚠️',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Disaster-prone and high-risk zones'
  },
  { 
    id: 'power_deprivation', 
    label: 'Power Issues', 
    icon: '⚡',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Electricity supply and infrastructure problems'
  },
  { 
    id: 'crime_mapping', 
    label: 'Crime Mapping', 
    icon: '🚔',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Safety and security concern areas'
  },
  { 
    id: 'green_inequality', 
    label: 'Green Spaces', 
    icon: '🌳',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Lack of parks and green infrastructure'
  },
  { 
    id: 'transit_gaps', 
    label: 'Transit Gaps', 
    icon: '🚌',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Public transportation accessibility issues'
  },
  { 
    id: 'land_use_violations', 
    label: 'Land Use Issues', 
    icon: '🏗️',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Zoning and land use violations'
  },
  { 
    id: 'infra_inequality', 
    label: 'Infrastructure', 
    icon: '🏗️',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Basic infrastructure gaps and inequities'
  }
];

export default function ProblemSelector({ 
  selectedProblem, 
  onProblemSelect, 
  issueStats = {},
  layout = 'grid' 
}) {
  if (layout === 'tabs') {
    return (
      <div className="border-b border-white/10 mb-6 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          <Button
            variant={selectedProblem === null ? "default" : "ghost"}
            size="sm"
            onClick={() => onProblemSelect(null)}
            className="whitespace-nowrap"
          >
            All Problems
          </Button>
          {problemTypes.map((problem) => (
            <Button
              key={problem.id}
              variant={selectedProblem === problem.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onProblemSelect(problem.id)}
              className="whitespace-nowrap flex items-center gap-2"
            >
              <span>{problem.icon}</span>
              <span>{problem.label}</span>
              {issueStats[problem.id] && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {issueStats[problem.id]}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      <Button
        variant={selectedProblem === null ? "default" : "outline"}
        onClick={() => onProblemSelect(null)}
        className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors"
      >
        <span className="text-3xl">🌍</span>
        <div className="text-center">
          <span className="font-medium block">All Problems</span>
          <div className="flex items-center gap-2 justify-center mt-2">
            <span className="text-2xl">🌍</span>
            <Badge variant="secondary" className="text-xs">
              {Object.values(issueStats).reduce((a, b) => a + b, 0)}
            </Badge>
          </div>
        </div>
      </Button>
      
      {problemTypes.map((problem) => (
        <Button
          key={problem.id}
          variant={selectedProblem === problem.id ? "default" : "outline"}
          onClick={() => onProblemSelect(problem.id)}
          className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors"
        >
          <span className="text-3xl">{problem.icon}</span>
          <div className="text-center">
            <span className="font-medium text-center leading-tight block">{problem.label}</span>
            <div className="flex items-center gap-2 justify-center mt-2">
              <span className="text-lg">{problem.icon}</span>
              <Badge variant="secondary" className="text-xs">
                {issueStats[problem.id] || 0}
              </Badge>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}

export { problemTypes };
