"use client";
import React, { useState, useEffect } from "react";
import { GraphQLClient } from "graphql-request";

const graphQLClient = new GraphQLClient("https://vote.optimism.io/graphql");

const ProjectsComponent = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);

  // inside your ProjectsComponent
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/rpgf3tracker");
        const { projects } = await res.json();
        setProjects(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <h1 className="text-2xl font-semibold leading-tight py-2">Projects</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="py-4">
          <div className="">
            <table className="table-auto min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="">
                <tr>
                  <th className="text-left py-1 px-2 uppercase font-bold text-xs">
                    Display Name
                  </th>
                  <th className="text-left py-1 px-2 uppercase font-bold text-xs">
                    Impact Category
                  </th>
                  <th className="text-left py-1 px-2 uppercase font-bold text-xs">
                    Included in Ballots
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">
                    Lists
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">
                    Website
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-200 dark:divide-gray-700">
                {projects
                  .sort((a, b) => b.includedInBallots - a.includedInBallots)
                  .map((project) => (
                    <tr key={project.id}>
                      <td className="text-left py-1 px-2">
                        {project.displayName}
                      </td>
                      <td className="text-left py-1 px-2 text-[0.5rem]">
                        {project.impactCategory}
                      </td>
                      <td className="text-left py-1 px-2">
                        {project.includedInBallots}
                      </td>
                      <td className="text-left py-3 px-4">
                        <ul className="list-disc list-inside">
                          {project.lists.map((list, index) => (
                            <li
                              key={index}
                              className="mb-3 flex justify-between"
                            >
                              <div className="font-semibold">
                                {list.listName}
                              </div>
                              <div className="flex space-x-1">
                                <a
                                  href={list.impactEvaluationLink}
                                  className="text-blue-500 hover:text-blue-800"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Evaluation
                                </a>
                                <p
                                  className="text-xs underline"
                                  title={list.impactEvaluationDescription}
                                >
                                  Desc
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="text-left py-3 px-4">
                        <a
                          href={project.websiteUrl}
                          className="text-blue-500 hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsComponent;