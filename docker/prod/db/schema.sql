--
-- PostgreSQL database dump
--

\restrict 3TuFQZ3lk8ShvuOow9bIGt6DqsncBm4CpuHupIa9Mm3GvZ1AjNSeBLKrejEmPcu

-- Dumped from database version 16.12 (8dbf2dd)
-- Dumped by pg_dump version 16.11 (Homebrew)

-- Started on 2026-04-19 14:41:00 CEST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.goals (
    "userId" integer NOT NULL,
    "selectedGoals" text[] NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.tutorials (
    "userId" integer NOT NULL,
    "isOnBoardingTutorialView" boolean,
    "isAccountTutorialView" boolean,
    "isDashboardTutorialView" boolean,
    "isBalanceInsightsTutorialView" boolean,
    "isIncomeTutorialView" boolean,
    "isSharingTutorialView" boolean,
    "isCategoryTutorialView" boolean,
    "onBoardingViewedSlidesCount" integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT tutorials_user_id_unique UNIQUE ("userId")
);

--
-- TOC entry 232 (class 1259 OID 33102)
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    "accountId" integer NOT NULL,
    "userId" integer NOT NULL,
    "accountName" character varying(128) NOT NULL,
    amount numeric NOT NULL,
    "currencyCode" character varying(3) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone,
    status smallint,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp with time zone,
    "iconId" character varying,
    "colorId" character varying,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 33101)
-- Name: accounts_accountId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."accounts_accountId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3601 (class 0 OID 0)
-- Dependencies: 231
-- Name: accounts_accountId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."accounts_accountId_seq" OWNED BY public.accounts."accountId";


--
-- TOC entry 242 (class 1259 OID 262145)
-- Name: balance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balance (
    "balanceId" integer NOT NULL,
    "userId" integer NOT NULL,
    balance numeric NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone
);


--
-- TOC entry 241 (class 1259 OID 262144)
-- Name: balance_balanceId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."balance_balanceId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3602 (class 0 OID 0)
-- Dependencies: 241
-- Name: balance_balanceId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."balance_balanceId_seq" OWNED BY public.balance."balanceId";


--
-- TOC entry 234 (class 1259 OID 33121)
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    "categoryId" integer NOT NULL,
    "categoryName" character varying(128) NOT NULL,
    "userId" integer NOT NULL,
    "currencyCode" character varying(3) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone,
    status smallint,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp with time zone,
    "iconId" character varying,
    "colorId" character varying,
    budget numeric(12,2),
    "position" integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 33120)
-- Name: categories_categoryId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."categories_categoryId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3603 (class 0 OID 0)
-- Dependencies: 233
-- Name: categories_categoryId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."categories_categoryId_seq" OWNED BY public.categories."categoryId";


--
-- TOC entry 226 (class 1259 OID 33048)
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    "currencyCode" character varying(3) NOT NULL,
    "currencyName" character varying(56) NOT NULL,
    symbol character varying(10) NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 33047)
-- (currencies surrogate sequence removed)
--

-- currencies use currencyCode as the natural primary key; no surrogate sequence


--
-- TOC entry 243 (class 1259 OID 278528)
-- Name: currencyRates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."currencyRates" (
    "baseCurrency" character varying(3) NOT NULL,
    "targetCurrency" character varying(3) NOT NULL,
    rate numeric(18,6) NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


CREATE TABLE public.historical_currency_rates (
    "baseCurrency" character varying(3) NOT NULL,
    "targetCurrency" character varying(3) NOT NULL,
    rate numeric(18,6) NOT NULL,
    date date NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 33039)
-- Name: currencytype; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencytype (
    "currencyTypeId" integer NOT NULL,
    "currencyType" integer NOT NULL,
    "currencyTypeName" character varying(56) NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 33038)
-- Name: currencytype_currencyTypeId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."currencytype_currencyTypeId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3605 (class 0 OID 0)
-- Dependencies: 223
-- Name: currencytype_currencyTypeId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."currencytype_currencyTypeId_seq" OWNED BY public.currencytype."currencyTypeId";


--
-- TOC entry 246 (class 1259 OID 688172)
-- Name: daily_accounts_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_accounts_stats (
    "userId" integer NOT NULL,
    date date NOT NULL,
    income_source_total numeric(18,2) DEFAULT 0 NOT NULL,
    income_target_total numeric(18,2) DEFAULT 0 NOT NULL,
    expense_source_total numeric(18,2) DEFAULT 0 NOT NULL,
    expense_target_total numeric(18,2) DEFAULT 0 NOT NULL,
    "currencyCode" character varying(3),
    "targetCurrencyCode" character varying(3),
    "accountId" integer NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 245 (class 1259 OID 688155)
-- Name: daily_categories_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_categories_stats (
    "userId" integer NOT NULL,
    date date NOT NULL,
    source_total numeric(18,2) DEFAULT 0 NOT NULL,
    target_total numeric(18,2) DEFAULT 0 NOT NULL,
    "currencyCode" character varying(3),
    "targetCurrencyCode" character varying(3),
    "categoryId" integer NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 247 (class 1259 OID 688190)
-- Name: daily_incomes_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_incomes_stats (
    "userId" integer NOT NULL,
    date date NOT NULL,
    source_total numeric(18,2) DEFAULT 0 NOT NULL,
    target_total numeric(18,2) DEFAULT 0 NOT NULL,
    "currencyCode" character varying(3),
    "targetCurrencyCode" character varying(3),
    "incomeId" integer NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 244 (class 1259 OID 688141)
-- Name: daily_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_stats (
    "userId" integer NOT NULL,
    date date NOT NULL,
    "currencyCode" character varying(3) NOT NULL,
    income_total numeric(18,2) DEFAULT 0 NOT NULL,
    expense_total numeric(18,2) DEFAULT 0 NOT NULL,
    transfer_total numeric(18,2) DEFAULT 0 NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 248 (class 1259 OID 688207)
-- Name: daily_transfer_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_transfer_stats (
    "userId" integer NOT NULL,
    date date NOT NULL,
    source_total numeric(18,2) DEFAULT 0 NOT NULL,
    target_total numeric(18,2) DEFAULT 0 NOT NULL,
    "currencyCode" character varying(3),
    "targetCurrencyCode" character varying(3),
    "accountId" integer NOT NULL,
    "targetAccountId" integer NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 250 (class 1259 OID 827393)
-- Name: email_changing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_changing (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "confirmationCode" integer NOT NULL,
    confirmed boolean DEFAULT false,
    email character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL
);


--
-- TOC entry 249 (class 1259 OID 827392)
-- Name: email_changing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_changing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3606 (class 0 OID 0)
-- Dependencies: 249
-- Name: email_changing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_changing_id_seq OWNED BY public.email_changing.id;


--
-- TOC entry 254 (class 1259 OID 827425)
-- Name: email_confirmations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_confirmations (
    "confirmationId" integer NOT NULL,
    "userId" integer NOT NULL,
    email character varying(100) NOT NULL,
    "confirmationCode" integer NOT NULL,
    confirmed boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    status smallint NOT NULL DEFAULT 3
);


--
-- TOC entry 253 (class 1259 OID 827424)
-- Name: email_confirmations_confirmationId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."email_confirmations_confirmationId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3607 (class 0 OID 0)
-- Dependencies: 253
-- Name: email_confirmations_confirmationId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."email_confirmations_confirmationId_seq" OWNED BY public.email_confirmations."confirmationId";


--
-- TOC entry 222 (class 1259 OID 33025)
-- Name: groupinvitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groupinvitations (
    "invitationId" integer NOT NULL,
    "userGroupId" integer,
    "invitedEmail" character varying(128),
    status integer,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone
);


--
-- TOC entry 221 (class 1259 OID 33024)
-- Name: groupinvitations_invitationId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."groupinvitations_invitationId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3608 (class 0 OID 0)
-- Dependencies: 221
-- Name: groupinvitations_invitationId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."groupinvitations_invitationId_seq" OWNED BY public.groupinvitations."invitationId";


--
-- TOC entry 230 (class 1259 OID 33085)
-- Name: incomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incomes (
    "incomeId" integer NOT NULL,
    "userId" integer NOT NULL,
    "incomeName" character varying(128) NOT NULL,
    "currencyCode" character varying(3) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone,
    status smallint,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp with time zone,
    "iconId" character varying,
    "colorId" character varying,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 33084)
-- Name: incomes_incomeId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."incomes_incomeId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3609 (class 0 OID 0)
-- Dependencies: 229
-- Name: incomes_incomeId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."incomes_incomeId_seq" OWNED BY public.incomes."incomeId";


--
-- TOC entry 252 (class 1259 OID 827409)
-- Name: password_changing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_changing (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "confirmationCode" integer NOT NULL,
    confirmed boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL
);


--
-- TOC entry 251 (class 1259 OID 827408)
-- Name: password_changing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_changing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3610 (class 0 OID 0)
-- Dependencies: 251
-- Name: password_changing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_changing_id_seq OWNED BY public.password_changing.id;


--
-- TOC entry 256 (class 1259 OID 925697)
-- Name: password_forgot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_forgot (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    email character varying(100) NOT NULL,
    "confirmationCode" integer NOT NULL,
    confirmed boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL
);


--
-- TOC entry 255 (class 1259 OID 925696)
-- Name: password_forgot_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_forgot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3611 (class 0 OID 0)
-- Dependencies: 255
-- Name: password_forgot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_forgot_id_seq OWNED BY public.password_forgot.id;


--
-- TOC entry 228 (class 1259 OID 33064)
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    "profileId" integer NOT NULL,
    "userId" integer NOT NULL,
    "publicName" character varying(50),
    "currencyCode" character varying(3),
    "additionalInfo" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone,
    locale character varying(10),
    "mailConfirmed" boolean DEFAULT false
);


--
-- TOC entry 227 (class 1259 OID 33063)
-- Name: profiles_profileId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."profiles_profileId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3612 (class 0 OID 0)
-- Dependencies: 227
-- Name: profiles_profileId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."profiles_profileId_seq" OWNED BY public.profiles."profileId";


--
-- TOC entry 218 (class 1259 OID 32987)
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    "roleId" integer NOT NULL,
    "roleType" integer NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 32986)
-- Name: roles_roleId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."roles_roleId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3613 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_roleId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."roles_roleId_seq" OWNED BY public.roles."roleId";


--
-- TOC entry 240 (class 1259 OID 163848)
-- Name: transactionTypes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."transactionTypes" (
    "transactionTypeId" integer NOT NULL,
    "transactionType" character varying(50) NOT NULL
);


--
-- TOC entry 239 (class 1259 OID 163847)
-- Name: transactionTypes_transactionTypeId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."transactionTypes_transactionTypeId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3614 (class 0 OID 0)
-- Dependencies: 239
-- Name: transactionTypes_transactionTypeId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."transactionTypes_transactionTypeId_seq" OWNED BY public."transactionTypes"."transactionTypeId";


--
-- TOC entry 236 (class 1259 OID 33143)
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    "transactionId" integer NOT NULL,
    "userId" integer NOT NULL,
    "categoryId" integer,
    "accountId" integer,
    "incomeId" integer,
    amount numeric NOT NULL,
    description character varying(256),
    "currencyCode" character varying(3) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone,
    "transactionTypeId" integer NOT NULL,
    "targetAccountId" integer,
    "targetAmount" numeric,
    "targetCurrencyCode" character varying(3),
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- TOC entry 235 (class 1259 OID 33142)
-- Name: transactions_transactionId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."transactions_transactionId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3615 (class 0 OID 0)
-- Dependencies: 235
-- Name: transactions_transactionId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."transactions_transactionId_seq" OWNED BY public.transactions."transactionId";

--
-- TOC entry 219 (class 1259 OID 33010)
-- Name: usergroups_userGroupId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."usergroups_userGroupId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 238 (class 1259 OID 81921)
-- Name: userroles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.userroles (
    "userRoleId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "userId" integer NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 81920)
-- Name: userroles_userRoleId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."userroles_userRoleId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3617 (class 0 OID 0)
-- Dependencies: 237
-- Name: userroles_userRoleId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."userroles_userRoleId_seq" OWNED BY public.userroles."userRoleId";


--
-- TOC entry 216 (class 1259 OID 32975)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    "userId" integer NOT NULL,
    email character varying(100) NOT NULL,
    "passwordHash" character varying(256) NOT NULL,
    salt character varying(256) NOT NULL,
    status integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone,
    "sessionsValidFrom" timestamp without time zone
);


--
-- TOC entry 215 (class 1259 OID 32974)
-- Name: users_userId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."users_userId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3618 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_userId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."users_userId_seq" OWNED BY public.users."userId";


--
-- TOC entry 3303 (class 2604 OID 33105)
-- Name: accounts accountId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN "accountId" SET DEFAULT nextval('public."accounts_accountId_seq"'::regclass);


--
-- TOC entry 3314 (class 2604 OID 262148)
-- Name: balance balanceId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance ALTER COLUMN "balanceId" SET DEFAULT nextval('public."balance_balanceId_seq"'::regclass);


--
-- TOC entry 3306 (class 2604 OID 33124)
-- Name: categories categoryId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN "categoryId" SET DEFAULT nextval('public."categories_categoryId_seq"'::regclass);


--
-- TOC entry 3296 (class 2604 OID 33051)
-- (currencies surrogate-key default removed)
--

-- currencies.currencyCode is supplied explicitly (natural key); no DEFAULT


--
-- TOC entry 3295 (class 2604 OID 33042)
-- Name: currencytype currencyTypeId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencytype ALTER COLUMN "currencyTypeId" SET DEFAULT nextval('public."currencytype_currencyTypeId_seq"'::regclass);


--
-- TOC entry 3330 (class 2604 OID 827396)
-- Name: email_changing id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_changing ALTER COLUMN id SET DEFAULT nextval('public.email_changing_id_seq'::regclass);


--
-- TOC entry 3336 (class 2604 OID 827428)
-- Name: email_confirmations confirmationId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_confirmations ALTER COLUMN "confirmationId" SET DEFAULT nextval('public."email_confirmations_confirmationId_seq"'::regclass);


--
-- TOC entry 3294 (class 2604 OID 33028)
-- Name: groupinvitations invitationId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupinvitations ALTER COLUMN "invitationId" SET DEFAULT nextval('public."groupinvitations_invitationId_seq"'::regclass);


--
-- TOC entry 3300 (class 2604 OID 33088)
-- Name: incomes incomeId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incomes ALTER COLUMN "incomeId" SET DEFAULT nextval('public."incomes_incomeId_seq"'::regclass);


--
-- TOC entry 3333 (class 2604 OID 827412)
-- Name: password_changing id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_changing ALTER COLUMN id SET DEFAULT nextval('public.password_changing_id_seq'::regclass);


--
-- TOC entry 3339 (class 2604 OID 925700)
-- Name: password_forgot id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_forgot ALTER COLUMN id SET DEFAULT nextval('public.password_forgot_id_seq'::regclass);


--
-- TOC entry 3297 (class 2604 OID 33067)
-- Name: profiles profileId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles ALTER COLUMN "profileId" SET DEFAULT nextval('public."profiles_profileId_seq"'::regclass);


--
-- TOC entry 3291 (class 2604 OID 32990)
-- Name: roles roleId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN "roleId" SET DEFAULT nextval('public."roles_roleId_seq"'::regclass);


--
-- TOC entry 3313 (class 2604 OID 163851)
-- Name: transactionTypes transactionTypeId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."transactionTypes" ALTER COLUMN "transactionTypeId" SET DEFAULT nextval('public."transactionTypes_transactionTypeId_seq"'::regclass);


--
-- TOC entry 3309 (class 2604 OID 33146)
-- Name: transactions transactionId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN "transactionId" SET DEFAULT nextval('public."transactions_transactionId_seq"'::regclass);



--
-- TOC entry 3312 (class 2604 OID 81924)
-- Name: userroles userRoleId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userroles ALTER COLUMN "userRoleId" SET DEFAULT nextval('public."userroles_userRoleId_seq"'::regclass);


--
-- TOC entry 3289 (class 2604 OID 32978)
-- Name: users userId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN "userId" SET DEFAULT nextval('public."users_userId_seq"'::regclass);


--
-- TOC entry 3375 (class 2606 OID 33109)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY ("accountId");


--
-- TOC entry 3389 (class 2606 OID 262153)
-- Name: balance balance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance
    ADD CONSTRAINT balance_pkey PRIMARY KEY ("balanceId");


--
-- TOC entry 3377 (class 2606 OID 33126)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY ("categoryId");


--
-- TOC entry 3363 (class 2606 OID 33055)
-- Name: currencies currencies_currencyCode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

-- currencyCode uniqueness is enforced by the primary key below


--
-- TOC entry 3365 (class 2606 OID 33057)
-- Name: currencies currencies_currencyName_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT "currencies_currencyName_key" UNIQUE ("currencyName");


--
-- TOC entry 3367 (class 2606 OID 33053)
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY ("currencyCode");


--
-- TOC entry 3393 (class 2606 OID 278533)
-- Name: currencyRates currencyRates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."currencyRates"
    ADD CONSTRAINT "currencyRates_pkey" PRIMARY KEY ("baseCurrency", "targetCurrency");


--
-- TOC entry 3359 (class 2606 OID 33046)
-- Name: currencytype currencytype_currencyTypeName_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencytype
    ADD CONSTRAINT "currencytype_currencyTypeName_key" UNIQUE ("currencyTypeName");


--
-- TOC entry 3361 (class 2606 OID 33044)
-- Name: currencytype currencytype_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencytype
    ADD CONSTRAINT currencytype_pkey PRIMARY KEY ("currencyTypeId");


--
-- TOC entry 3399 (class 2606 OID 688179)
-- Name: daily_accounts_stats daily_accounts_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_accounts_stats
    ADD CONSTRAINT daily_accounts_stats_pkey PRIMARY KEY ("userId", date, "accountId");


--
-- TOC entry 3397 (class 2606 OID 688161)
-- Name: daily_categories_stats daily_categories_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_categories_stats
    ADD CONSTRAINT daily_categories_stats_pkey PRIMARY KEY ("userId", date, "categoryId");


--
-- TOC entry 3401 (class 2606 OID 688196)
-- Name: daily_incomes_stats daily_incomes_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_incomes_stats
    ADD CONSTRAINT daily_incomes_stats_pkey PRIMARY KEY ("userId", date, "incomeId");


--
-- TOC entry 3395 (class 2606 OID 688149)
-- Name: daily_stats daily_stats_userId_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_stats
    ADD CONSTRAINT "daily_stats_userId_date_key" UNIQUE ("userId", date, "currencyCode");


--
-- TOC entry 3403 (class 2606 OID 688213)
-- Name: daily_transfer_stats daily_transfer_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_transfer_stats
    ADD CONSTRAINT daily_transfer_stats_pkey PRIMARY KEY ("userId", "accountId", "targetAccountId", date);


--
-- TOC entry 3405 (class 2606 OID 827400)
-- Name: email_changing email_changing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_changing
    ADD CONSTRAINT email_changing_pkey PRIMARY KEY (id);


--
-- TOC entry 3411 (class 2606 OID 827432)
-- Name: email_confirmations email_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_confirmations
    ADD CONSTRAINT email_confirmations_pkey PRIMARY KEY ("confirmationId");


--
-- TOC entry 3413 (class 2606 OID 827434)
-- Name: email_confirmations email_confirmations_userId_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_confirmations
    ADD CONSTRAINT "email_confirmations_userId_email_key" UNIQUE ("userId", email);


--
-- TOC entry 3355 (class 2606 OID 33030)
-- Name: groupinvitations groupinvitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupinvitations
    ADD CONSTRAINT groupinvitations_pkey PRIMARY KEY ("invitationId");


--
-- TOC entry 3357 (class 2606 OID 33032)
-- Name: groupinvitations groupinvitations_userGroupId_invitedEmail_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupinvitations
    ADD CONSTRAINT "groupinvitations_userGroupId_invitedEmail_key" UNIQUE ("userGroupId", "invitedEmail");


--
-- TOC entry 3373 (class 2606 OID 33090)
-- Name: incomes incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT incomes_pkey PRIMARY KEY ("incomeId");


--
-- TOC entry 3407 (class 2606 OID 827416)
-- Name: password_changing password_changing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_changing
    ADD CONSTRAINT password_changing_pkey PRIMARY KEY (id);


--
-- TOC entry 3415 (class 2606 OID 925704)
-- Name: password_forgot password_forgot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_forgot
    ADD CONSTRAINT password_forgot_pkey PRIMARY KEY (id);


--
-- TOC entry 3417 (class 2606 OID 925706)
-- Name: password_forgot password_forgot_userId_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_forgot
    ADD CONSTRAINT "password_forgot_userId_email_key" UNIQUE ("userId", email, "confirmationCode");


--
-- TOC entry 3369 (class 2606 OID 33071)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY ("profileId");


--
-- TOC entry 3371 (class 2606 OID 33073)
-- Name: profiles profiles_userId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_key" UNIQUE ("userId");


--
-- TOC entry 3347 (class 2606 OID 32992)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY ("roleId");


--
-- TOC entry 3349 (class 2606 OID 32994)
-- Name: roles roles_roleType_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "roles_roleType_key" UNIQUE ("roleType");


--
-- TOC entry 3385 (class 2606 OID 163853)
-- Name: transactionTypes transactionTypes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."transactionTypes"
    ADD CONSTRAINT "transactionTypes_pkey" PRIMARY KEY ("transactionTypeId");


--
-- TOC entry 3379 (class 2606 OID 33150)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY ("transactionId");


--
-- TOC entry 3387 (class 2606 OID 172033)
-- Name: transactionTypes unique_transactiontype; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."transactionTypes"
    ADD CONSTRAINT unique_transactiontype UNIQUE ("transactionType");


--
-- TOC entry 3391 (class 2606 OID 270337)
-- Name: balance unique_userid; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance
    ADD CONSTRAINT unique_userid UNIQUE ("userId");


--
-- TOC entry 3381 (class 2606 OID 81926)
-- Name: userroles userroles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_pkey PRIMARY KEY ("userRoleId");


--
-- TOC entry 3383 (class 2606 OID 81928)
-- Name: userroles userroles_userId_roleId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT "userroles_userId_roleId_key" UNIQUE ("userId", "roleId");


--
-- TOC entry 3343 (class 2606 OID 32985)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3345 (class 2606 OID 32983)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY ("userId");


--
-- TOC entry 3424 (class 2606 OID 33115)
-- Name: accounts accounts_currencyCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES public.currencies("currencyCode");


--
-- TOC entry 3425 (class 2606 OID 33110)
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3437 (class 2606 OID 262154)
-- Name: balance balance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance
    ADD CONSTRAINT "balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3426 (class 2606 OID 33137)
-- Name: categories categories_currencyCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES public.currencies("currencyCode");


--
-- TOC entry 3427 (class 2606 OID 33132)
-- Name: categories categories_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3442 (class 2606 OID 688185)
-- Name: daily_accounts_stats daily_accounts_stats_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_accounts_stats
    ADD CONSTRAINT "daily_accounts_stats_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts("accountId");


--
-- TOC entry 3443 (class 2606 OID 688180)
-- Name: daily_accounts_stats daily_accounts_stats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_accounts_stats
    ADD CONSTRAINT "daily_accounts_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3440 (class 2606 OID 688167)
-- Name: daily_categories_stats daily_categories_stats_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_categories_stats
    ADD CONSTRAINT "daily_categories_stats_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories("categoryId");


--
-- TOC entry 3441 (class 2606 OID 688162)
-- Name: daily_categories_stats daily_categories_stats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_categories_stats
    ADD CONSTRAINT "daily_categories_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3444 (class 2606 OID 688202)
-- Name: daily_incomes_stats daily_incomes_stats_incomeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_incomes_stats
    ADD CONSTRAINT "daily_incomes_stats_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES public.incomes("incomeId");


--
-- TOC entry 3445 (class 2606 OID 688197)
-- Name: daily_incomes_stats daily_incomes_stats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_incomes_stats
    ADD CONSTRAINT "daily_incomes_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3439 (class 2606 OID 688150)
-- Name: daily_stats daily_stats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_stats
    ADD CONSTRAINT "daily_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3446 (class 2606 OID 688219)
-- Name: daily_transfer_stats daily_transfer_stats_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_transfer_stats
    ADD CONSTRAINT "daily_transfer_stats_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts("accountId");


--
-- TOC entry 3447 (class 2606 OID 688224)
-- Name: daily_transfer_stats daily_transfer_stats_targetAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_transfer_stats
    ADD CONSTRAINT "daily_transfer_stats_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES public.accounts("accountId");


--
-- TOC entry 3448 (class 2606 OID 688214)
-- Name: daily_transfer_stats daily_transfer_stats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_transfer_stats
    ADD CONSTRAINT "daily_transfer_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT "public.goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");

ALTER TABLE ONLY public.tutorials
    ADD CONSTRAINT "public.tutorials_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");
--
-- TOC entry 3449 (class 2606 OID 827403)
-- Name: email_changing email_changing_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_changing
    ADD CONSTRAINT "email_changing_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId") ON DELETE CASCADE;


--
-- TOC entry 3451 (class 2606 OID 827435)
-- Name: email_confirmations email_confirmations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_confirmations
    ADD CONSTRAINT "email_confirmations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId") ON DELETE CASCADE;


--
-- TOC entry 3428 (class 2606 OID 204800)
-- Name: transactions fk_targetaccountid; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_targetaccountid FOREIGN KEY ("targetAccountId") REFERENCES public.accounts("accountId");


--
-- TOC entry 3429 (class 2606 OID 180230)
-- Name: transactions fk_transactiontypes; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactiontypes FOREIGN KEY ("transactionTypeId") REFERENCES public."transactionTypes"("transactionTypeId");


--
-- TOC entry 3438 (class 2606 OID 270338)
-- Name: balance fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance
    ADD CONSTRAINT fk_user_id FOREIGN KEY ("userId") REFERENCES public.users("userId") ON DELETE CASCADE;



--
-- TOC entry 3422 (class 2606 OID 33096)
-- Name: incomes incomes_currencyCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT "incomes_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES public.currencies("currencyCode");


--
-- TOC entry 3423 (class 2606 OID 33091)
-- Name: incomes incomes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT "incomes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--
-- TOC entry 3450 (class 2606 OID 827419)
-- Name: password_changing password_changing_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_changing
    ADD CONSTRAINT "password_changing_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId") ON DELETE CASCADE;


--
-- TOC entry 3452 (class 2606 OID 925707)
-- Name: password_forgot password_forgot_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_forgot
    ADD CONSTRAINT "password_forgot_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId") ON DELETE CASCADE;


--
-- TOC entry 3420 (class 2606 OID 33079)
-- Name: profiles profiles_currencyCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES public.currencies("currencyCode");


--
-- TOC entry 3421 (class 2606 OID 33074)
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId") ON DELETE CASCADE;


--
-- TOC entry 3430 (class 2606 OID 33151)
-- Name: transactions transactions_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts("accountId");


--
-- TOC entry 3431 (class 2606 OID 33166)
-- Name: transactions transactions_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories("categoryId");


--
-- TOC entry 3432 (class 2606 OID 33161)
-- Name: transactions transactions_currencyCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES public.currencies("currencyCode");


--
-- TOC entry 3433 (class 2606 OID 33171)
-- Name: transactions transactions_incomeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES public.incomes("incomeId");


--
-- TOC entry 3434 (class 2606 OID 33156)
-- Name: transactions transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


--

--
-- TOC entry 3435 (class 2606 OID 90112)
-- Name: userroles userroles_roles_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_roles_fk FOREIGN KEY ("roleId") REFERENCES public.roles("roleId") ON DELETE CASCADE;


--
-- TOC entry 3436 (class 2606 OID 81929)
-- Name: userroles userroles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT "userroles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users("userId");


INSERT INTO public."transactionTypes" ("transactionTypeId","transactionType") VALUES
                                                                                  (1,'income'),
                                                                                  (2,'expense'),
                                                                                  (3,'transfer');
INSERT INTO public.currencies ("currencyCode","currencyName",symbol) VALUES
                                                                         ('USD','US Dollar','$'),
                                                                         ('EUR','Euro','€'),
                                                                         ('GBP','British Pound','£'),
                                                                         ('CHF','Swiss Franc','CHF'),
                                                                         ('SEK','Swedish Krona','kr'),
                                                                         ('DKK','Danish Krone','kr'),
                                                                         ('NOK','Norwegian Krone','kr'),
                                                                         ('BGN','Bulgarian Lev','лв'),
                                                                         ('CZK','Czech Koruna','Kč'),
                                                                         ('PLN','Polish Zloty','zł');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('USD','USD',1.000000,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','EUR',0.861070,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','GBP',0.734510,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','CHF',0.805160,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','SEK',9.516621,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','DKK',6.423891,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','NOK',10.114882,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','BGN',1.683370,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','CZK',21.321902,'2025-06-25 12:48:16.802737'),
                                                                                          ('USD','PLN',3.660141,'2025-06-25 12:48:16.802737');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('EUR','USD',1.161346,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','EUR',1.000000,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','GBP',0.853020,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','CHF',0.935069,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','SEK',11.052086,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','DKK',7.460358,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','NOK',11.746873,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','BGN',1.954975,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','CZK',24.762097,'2025-06-25 12:48:17.093839'),
                                                                                          ('EUR','PLN',4.250688,'2025-06-25 12:48:17.093839');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('GBP','USD',1.361452,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','EUR',1.172305,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','GBP',1.000000,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','CHF',1.096187,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','SEK',12.956419,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','DKK',8.745817,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','NOK',13.770922,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','BGN',2.291827,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','CZK',29.028738,'2025-06-25 12:48:17.372825'),
                                                                                          ('GBP','PLN',4.983104,'2025-06-25 12:48:17.372825');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('CHF','USD',1.241989,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','EUR',1.069440,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','GBP',0.912253,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','CHF',1.000000,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','SEK',11.819538,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','DKK',7.978402,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','NOK',12.562571,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','BGN',2.090727,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','CZK',26.481567,'2025-06-25 12:48:17.661685'),
                                                                                          ('CHF','PLN',4.545854,'2025-06-25 12:48:17.661685');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('SEK','USD',0.105079,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','EUR',0.090481,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','GBP',0.077182,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','CHF',0.084606,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','SEK',1.000000,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','DKK',0.675018,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','NOK',1.062865,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','BGN',0.176887,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','CZK',2.240491,'2025-06-25 12:48:17.938976'),
                                                                                          ('SEK','PLN',0.384605,'2025-06-25 12:48:17.938976');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('DKK','USD',0.155669,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','EUR',0.134042,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','GBP',0.114340,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','CHF',0.125338,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','SEK',1.481442,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','DKK',1.000000,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','NOK',1.574572,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','BGN',0.262048,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','CZK',3.319157,'2025-06-25 12:48:18.205831'),
                                                                                          ('DKK','PLN',0.569770,'2025-06-25 12:48:18.205831');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('NOK','USD',0.098864,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','EUR',0.085129,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','GBP',0.072617,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','CHF',0.079602,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','SEK',0.940853,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','DKK',0.635093,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','NOK',1.000000,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','BGN',0.166425,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','CZK',2.107974,'2025-06-25 12:48:18.485934'),
                                                                                          ('NOK','PLN',0.361857,'2025-06-25 12:48:18.485934');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('BGN','USD',0.594046,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','EUR',0.511516,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','GBP',0.436333,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','CHF',0.478302,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','SEK',5.653314,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','DKK',3.816089,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','NOK',6.008709,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','BGN',1.000000,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','CZK',12.666199,'2025-06-25 12:48:18.756429'),
                                                                                          ('BGN','PLN',2.174293,'2025-06-25 12:48:18.756429');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('CZK','USD',0.046900,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','EUR',0.040384,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','GBP',0.034449,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','CHF',0.037762,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','SEK',0.446331,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','DKK',0.301281,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','NOK',0.474389,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','BGN',0.078950,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','CZK',1.000000,'2025-06-25 12:48:19.018038'),
                                                                                          ('CZK','PLN',0.171661,'2025-06-25 12:48:19.018038');
INSERT INTO public."currencyRates" ("baseCurrency","targetCurrency",rate,"updatedAt") VALUES
                                                                                          ('PLN','USD',0.273214,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','EUR',0.235256,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','GBP',0.200678,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','CHF',0.219981,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','SEK',2.600070,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','DKK',1.755094,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','NOK',2.763523,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','BGN',0.459920,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','CZK',5.825433,'2025-06-25 12:48:19.276694'),
                                                                                          ('PLN','PLN',1.000000,'2025-06-25 12:48:19.276694');

INSERT INTO public.roles ("roleType") VALUES
                                          (1),
                                          (2);
-- Completed on 2026-04-19 14:41:03 CEST

--
-- PostgreSQL database dump complete
--

\unrestrict 3TuFQZ3lk8ShvuOow9bIGt6DqsncBm4CpuHupIa9Mm3GvZ1AjNSeBLKrejEmPcu

