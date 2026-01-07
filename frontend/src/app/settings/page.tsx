"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletTab } from "@/components/settings/wallet-tab";
import { CategoryTab } from "@/components/settings/category-tab";

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cài đặt & Quản lý</h2>
      </div>

      <Tabs defaultValue="wallets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wallets">Quản lý Ví</TabsTrigger>
          <TabsTrigger value="categories">Quản lý Danh mục</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ví của tôi</CardTitle>
              <CardDescription>
                Thêm, sửa, xóa các nguồn tiền (Tiền mặt, Ngân hàng, Ví điện tử...)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletTab />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh mục Thu/Chi</CardTitle>
              <CardDescription>
                Quản lý các nhóm chi tiêu và nguồn thu nhập của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}