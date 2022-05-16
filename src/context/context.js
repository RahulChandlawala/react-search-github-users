import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
	const [githubUser, setgithubUser] = useState(mockUser);
	const [repos, setrepos] = useState(mockRepos);
	const [followers, setfollowers] = useState(mockFollowers);

	const [requests, setrequests] = useState(0);
	const [loading, setloading] = useState(false);

	const [error, seterror] = useState({ show: false, msg: "" });

	const searchGithubUser = async (user) => {
		setloading(true);
		toggleError(false, "");
		// setloading(true)
		const resp = await axios(`${rootUrl}/users/${user}`).catch((err) =>
			console.log(err)
		);

		if (resp) {
			setgithubUser(resp.data);

			const { login, followers_url } = resp.data;
			//repos
			// axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((res) => {
			// 	setrepos(res.data);
			// });
			// //followes
			// axios(`${followers_url}?per_page=100`).then((res) => {
			// 	setfollowers(res.data);
			// });

			await Promise.allSettled([
				axios(`${rootUrl}/users/${login}/repos?per_page=100`),
				axios(`${followers_url}?per_page=100`),
			]).then((result) => {
				const [repos, followers] = result;
				const status = "fulfilled";
				if (repos.status === status) {
					setrepos(repos.value.data);
				}
				if (followers.status === status) {
					setfollowers(followers.value.data);
				}
			});
		} else {
			toggleError(true, "there is no user with that name");
		}
		setloading(false);
		checkRequests();
	};

	const checkRequests = () => {
		axios(`${rootUrl}/rate_limit`)
			.then(({ data }) => {
				let {
					rate: { remaining },
				} = data;

				setrequests(remaining);
				if (remaining === 0) {
					toggleError(true, "Sorry you have exceeded hourly limit!!");
				}
			})
			.catch((err) => {
				console.log(err);
			});
	};

	function toggleError(show = false, msg = "") {
		seterror({ show, msg });
	}

	useEffect(checkRequests, []);
	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				followers,
				requests,
				error,
				searchGithubUser,
				loading,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};

export { GithubContext, GithubProvider };
