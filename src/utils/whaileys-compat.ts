/**
 * Compatibility shim for whaileys (baileys v6) → baileys v7 types
 * 
 * whaileys is a fork of baileys v6 that maintains button/list support.
 * This file provides type stubs and fallback implementations for 
 * baileys v7-only features that don't exist in whaileys.
 */

// ===== Catalog types (WhatsApp Business catalog - v7 only) =====

export interface CatalogCollection {
  id: string;
  name: string;
  products: Product[];
  status: number;
}

export interface GetCatalogOptions {
  jid: string;
  limit?: number;
  cursor?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  url?: string;
  retailer_id?: string;
}

// ===== Newsletter/Channel JID check (v7 only) =====
export function isJidNewsletter(jid: string): boolean {
  return jid?.endsWith?.('@newsletter') || false;
}

// ===== Phone Number User check (v7 only) =====
export function isPnUser(jid: string): boolean {
  return (jid?.includes?.(':') && jid?.endsWith?.('@s.whatsapp.net')) || false;
}

// ===== Poll features (v7 only) =====
export function decryptPollVote(
  vote: any,
  opts: { pollCreatorJid: string; pollMsgId: string; voters: any[] },
): any {
  return vote;
}

export function getAggregateVotesInPollMessage(msg: any): any[] {
  return [];
}
