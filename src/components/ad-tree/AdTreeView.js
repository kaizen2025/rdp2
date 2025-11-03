// src/components/ad-tree/AdTreeView.js - VERSION CORRIGÉE

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// ✅ CORRECTION : On garde uniquement l'import depuis @mui/lab qui est compatible
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { CircularProgress, Box } from '@mui/material';

const AdTreeView = ({ onNodeSelect }) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchOUs = async (parentId = null) => {
    try {
      // Utilisation de l'apiService global serait mieux, mais axios fonctionne pour l'instant
      const response = await axios.get(`/api/ad/ous`, { params: { parentId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching OUs:', error);
      return [];
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOUs().then((rootOUs) => {
      setTreeData(rootOUs.map(ou => ({ ...ou, children: [] })));
      setLoading(false);
    });
  }, []);

  const handleToggle = async (event, nodeIds) => {
    const nodeId = nodeIds[0];
    if (!nodeId || nodeId.startsWith('stub_')) return;

    const findNodeById = (nodes, id) => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const node = findNodeById(treeData, nodeId);

    if (node && node.hasChildren && node.children.length === 0) {
      const children = await fetchOUs(node.id);
      
      const addChildrenToNode = (nodes, parentId, children) => {
          return nodes.map(node => {
              if (node.id === parentId) {
                  return { ...node, children: children.map(child => ({ ...child, children: [] })) };
              }
              if (node.children) {
                  return { ...node, children: addChildrenToNode(node.children, parentId, children) };
              }
              return node;
          });
      };
      
      setTreeData(prevData => addChildrenToNode(prevData, nodeId, children));
    }
  };

  const renderTree = (nodes) => (
    nodes.map((node) => (
      <TreeItem key={node.id} nodeId={node.id} label={node.name}>
        {node.hasChildren && (node.children.length > 0 ? renderTree(node.children) : [<TreeItem key={`stub_${node.id}`} nodeId={`stub_${node.id}`} label="..." />])}
      </TreeItem>
    ))
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleSelect = (event, nodeId) => {
    if (nodeId.startsWith('stub_')) return;
    setSelected(nodeId);
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  };

  return (
    <TreeView
      aria-label="ad-ou-tree"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      onNodeToggle={handleToggle}
      onNodeSelect={handleSelect}
      selected={selected}
      sx={{ height: '100%', flexGrow: 1, overflowY: 'auto' }}
    >
      {renderTree(treeData)}
    </TreeView>
  );
};

export default AdTreeView;