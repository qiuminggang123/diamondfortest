'use client'

import React, { useState, useEffect } from 'react';
import { SortableBeadList } from '@/components/SortableBeadList';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/lib/uiStore';
import type { BeadType } from '@/lib/types';

interface AdminBeadManagerProps {
  beads: BeadType[];
  onRefresh: () => void;
}

export function AdminBeadManager({ beads, onRefresh }: AdminBeadManagerProps) {
  const [managedBeads, setManagedBeads] = useState<BeadType[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, showLoading, hideLoading } = useUIStore();

  // 加载管理用的珠子数据（带排序信息）
  useEffect(() => {
    const loadManagedBeads = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/beads');
        
        if (response.ok) {
          const data = await response.json();
          // 转换数据格式以匹配前端需求
          const converted = data.map((bead: any) => ({
            id: bead.id,
            name: bead.name,
            image: bead.image,
            type: bead.category?.name || bead.typeId,
            size: bead.size,
            price: bead.price,
            sortOrder: bead.sortOrder
          }));
          
          // 按sortOrder排序
          const sorted = converted.sort((a: any, b: any) => 
            (a.sortOrder || 0) - (b.sortOrder || 0)
          );
          
          setManagedBeads(sorted);
        } else {
          showToast('加载珠子数据失败', 'error');
        }
      } catch (error) {
        console.error('Failed to load managed beads:', error);
        showToast('网络错误，加载失败', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadManagedBeads();
  }, [showToast]);

  // 更新排序
  const handleUpdateSort = async (beadIds: string[]) => {
    try {
      showLoading('正在更新排序...');
      
      const response = await fetch('/api/beads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ beadIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sort order');
      }

      // 重新加载数据以获取最新的排序
      const refreshResponse = await fetch('/api/beads');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const converted = data.map((bead: any) => ({
          id: bead.id,
          name: bead.name,
          image: bead.image,
          type: bead.category?.name || bead.typeId,
          size: bead.size,
          price: bead.price,
          sortOrder: bead.sortOrder
        }));
        
        const sorted = converted.sort((a: any, b: any) => 
          (a.sortOrder || 0) - (b.sortOrder || 0)
        );
        
        setManagedBeads(sorted);
      }
      
      onRefresh(); // 刷新主界面数据
      
    } catch (error) {
      console.error('Failed to update sort:', error);
      throw error;
    } finally {
      hideLoading();
    }
  };

  // 删除珠子
  const handleDeleteBead = async (id: string) => {
    try {
      showLoading('正在删除珠子...');
      
      const response = await fetch(`/api/beads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bead');
      }

      showToast('珠子删除成功', 'success');
      
      // 重新加载数据
      const refreshResponse = await fetch('/api/beads');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const converted = data.map((bead: any) => ({
          id: bead.id,
          name: bead.name,
          image: bead.image,
          type: bead.category?.name || bead.typeId,
          size: bead.size,
          price: bead.price,
          sortOrder: bead.sortOrder
        }));
        
        const sorted = converted.sort((a: any, b: any) => 
          (a.sortOrder || 0) - (b.sortOrder || 0)
        );
        
        setManagedBeads(sorted);
      }
      
      onRefresh(); // 刷新主界面数据
      
    } catch (error) {
      console.error('Failed to delete bead:', error);
      showToast('删除失败', 'error');
    } finally {
      hideLoading();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          珠子管理 ({managedBeads.length})
        </h3>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
        >
          刷新数据
        </Button>
      </div>
      
      <SortableBeadList
        beads={managedBeads}
        onUpdateSort={handleUpdateSort}
        onDeleteBead={handleDeleteBead}
      />
      
      {managedBeads.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无珠子数据，请先添加珠子
        </div>
      )}
    </div>
  );
}