export type User = {
	email: string
}

export type AuthContextType = {
	user: User | undefined
	login: (email: string) => void;
	logout: () => void;
}
