"use client";
import { useEffect } from "react";
export function AdminThemeBridge(){useEffect(()=>{document.documentElement.classList.add("admin-active");return()=>document.documentElement.classList.remove("admin-active")},[]);return null;}
