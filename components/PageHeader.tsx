"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "@/components/navigation/NavigationGuard";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function PageHeader({
  trail,
  showBack = true,
}: {
  trail: { label: string; href?: string }[];
  showBack?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={() => navigate("back")}
          aria-label="Go back"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-primary ring-1 ring-primary/30 outline-none transition-colors hover:bg-primary/10"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {trail.map((item, i) => (
            <Fragment key={`${item.label}-${i}`}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.href as string);
                      }}
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
