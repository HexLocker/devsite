import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles } from "@/lib/middleware/rbac";

export const GET = withRoles(
  ["ADMIN", "EDITOR"],
  async () => {
    const [, pages, products, orders, users, revenue] = await Promise.all([
      prisma.post.count(),
      prisma.page.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } },
      }),
    ]);

    // Additional breakdowns
    const [publishedPosts, , pendingOrders] = await Promise.all([
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "DRAFT" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      stats: {
        posts: publishedPosts,
        pages: pages,
        products: products,
        orders: orders,
        users: users,
        revenue: revenue._sum.total?.toNumber() ?? 0,
        pendingOrders: pendingOrders,
        mediaFiles: 0,
      },
    });
  }
);
