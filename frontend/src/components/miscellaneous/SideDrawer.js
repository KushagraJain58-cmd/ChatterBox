import {
	Avatar,
	Box,
	Button,
	Menu,
	MenuButton,
	MenuDivider,
	MenuItem,
	MenuList,
	Text,
	Tooltip,
	useDisclosure,
	Drawer,
	DrawerBody,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerContent,
	DrawerCloseButton,
	Input,
	useToast,
	Spinner
} from '@chakra-ui/react';
import { BellIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { ChatState } from '../../context/ChatProvider';
import React, { useState } from 'react';
import { Fragment } from 'react';
import ProfileModel from './ProfileModel';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import ChatLoading from '../ChatLoading';
import UserListItem from '../UserAvatar/UserListItem';

function SideDrawer() {
	const [ search, setSearch ] = useState('');
	const [ searchResult, setSearchResult ] = useState([]);
	const [ loading, setLoading ] = useState(false);
	const [ loadingChat, setLoadingChat ] = useState(false);

	const { user, setSelectedChat, chats, setChats } = ChatState();
	const history = useHistory();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const logoutHandler = () => {
		localStorage.removeItem('userInfo');
		history.push('/');
	};

	const toast = useToast();

	const handleSearch = async () => {
		if (!search) {
			toast({
				title: 'Please Enter something on Search',
				status: 'warning',
				duration: 5000,
				isClosable: true,
				position: 'top-left'
			});
		}
		try {
			setLoading(true);
			const config = {
				headers: {
					Authorization: `Bearer ${user.token}`
				}
			};

			const { data } = await axios.get(`/api/user?search=${search}`, config);
			setLoading(false);
			setSearchResult(data);
		} catch (error) {
			toast({
				title: 'Error Occured!',
				description: 'Failed to Load the Search Results',
				status: 'error',
				duration: 5000,
				isClosable: true,
				position: 'bottom-left'
			});
		}
	};

	const accessChat = async (userId) => {
		try {
			setLoadingChat(true);
			const config = {
				headers: {
					'Content-type': 'application/json',
					Authorization: `Bearer ${user.token}`
				}
			};
			const { data } = await axios.post(`/api/chat`, { userId }, config);

			if (!chats.find((c) => c._id === data._id)) setChats([ data, ...chats ]);
			setSelectedChat(data);
			setLoadingChat(false);
			onClose();
		} catch (error) {
			toast({
				title: 'Error fetching the chat',
				description: error.message,
				status: 'error',
				duration: 5000,
				isClosable: true,
				position: 'bottom-left'
			});
		}
	};

	return (
		<Fragment>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				bg="white"
				w="100%"
				p="5px 10px 5px 10px"
				borderWidth="5px"
			>
				<Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
					<Button variant="ghost" onClick={onOpen}>
						<i class="fas fa-search" />
						<Text d={{ base: 'none', md: 'flex' }} px={4}>
							Search User
						</Text>
					</Button>
				</Tooltip>
				<Text fontSize="2xl" fontFamily="Work sans">
					Talk-A-Tive
				</Text>
				<div>
					<Menu>
						<MenuButton p={1}>
							<BellIcon fontSize="2xl" m={1} />
						</MenuButton>
						{/* <MenuList></MenuList> */}
					</Menu>
					<Menu>
						<MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
							<Avatar size="sm" cursor="pointer" name={user.name} src={user.pic} />
						</MenuButton>
						<MenuList>
							<ProfileModel user={user}>
								<MenuItem>My Profile</MenuItem>
							</ProfileModel>
							<MenuDivider />
							<MenuItem onClick={logoutHandler}>Logout</MenuItem>
						</MenuList>
					</Menu>
				</div>
			</Box>
			<Drawer placement="left" onClose={onClose} isOpen={isOpen}>
				<DrawerOverlay />
				<DrawerContent>
					<DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
					<DrawerBody>
						<Box display="flex" pb={2}>
							<Input
								placeholder="Search by name or email"
								mr={2}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<Button onClick={handleSearch}>Go</Button>
						</Box>
						{loading ? (
							<ChatLoading />
						) : (
							searchResult.map((user) => (
								<UserListItem key={user.id} user={user} handleFunction={() => accessChat(user._id)} />
							))
						)}
						{loadingChat && <Spinner ml="auto" d="flex" />}
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</Fragment>
	);
}

export default SideDrawer;
