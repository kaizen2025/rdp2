// src/components/ad-tree/AdTreeView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TreeView, TreeItem } from '@mui/lab';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { CircularProgress, Box } from '@mui/material';

const AdTreeView = ({ onNodeSelect }) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
const AdTreeView = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOUs = async (parentId = null) => {
    try {
      const response = await axios.get(`/api/ad/ous`, { params: { parentId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching OUs:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchOUs().then((rootOUs) => {
      setTreeData(rootOUs.map(ou => ({ ...ou, children: [] })));
      setLoading(false);
    });
  }, []);

  const handleToggle = async (event, nodeIds) => {
    const nodeId = nodeIds[0];
    const node = findNodeById(treeData, nodeId);

    if (node && node.hasChildren && node.children.length === 0) {
      const children = await fetchOUs(node.id);
      const newTreeData = addChildrenToNode(treeData, nodeId, children);
      setTreeData(newTreeData);
    }
  };

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

  const renderTree = (nodes) => (
    nodes.map((node) => (
      <TreeItem key={node.id} nodeId={node.id} label={node.name}>
        {node.hasChildren && (node.children.length > 0 ? renderTree(node.children) : <TreeItem nodeId={`stub_${node.id}`} label="Chargement..." />)}
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
      sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
    >
      {renderTree(treeData)}
    </TreeView>
  );
};

export default AdTreeView;
