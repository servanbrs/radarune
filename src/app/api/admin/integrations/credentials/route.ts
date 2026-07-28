import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";
export async function GET(){try{return NextResponse.json(await integrationCredentialService.list(await getAdminActor()));}catch(error){return adminJsonError(error)}}
export async function PUT(request:Request){try{return NextResponse.json(await integrationCredentialService.upsert(await getAdminActor(),await request.json()));}catch(error){return adminJsonError(error)}}
