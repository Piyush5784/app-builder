For React performance optimization, think in terms of reducing unnecessary renders, reducing expensive calculations, optimizing data flow, and minimizing bundle/runtime cost.

1. Prevent unnecessary re-renders
React.memo

Memoizes a component and skips rendering if props haven't changed.

const UserCard = React.memo(({ user }) => {
  console.log("render");
  return <div>{user.name}</div>;
});

Good for:

Large lists
Expensive UI components
Components receiving stable props

Avoid everywhere because comparison itself has a cost.

2. useMemo — cache expensive calculations

Runs only when dependencies change.

const filteredUsers = useMemo(() => {
  return users.filter(user =>
    user.name.includes(search)
  );
}, [users, search]);

Good for:

Filtering/sorting large arrays
Complex calculations
Data transformations

Bad:

const name = useMemo(() => user.name, [user]);

No benefit.

3. useCallback — cache functions

Prevents creating new function references.

Without:

function App() {
  const handleClick = () => {
    console.log("clicked");
  };

  return <Button onClick={handleClick}/>;
}

Every render creates a new function.

With:

const handleClick = useCallback(() => {
  console.log("clicked");
}, []);

Useful with:

React.memo(Button)

because otherwise props change every render.

4. useRef — store mutable values without rendering

Changing state causes re-render:

const [count,setCount] = useState(0);

Ref doesn't:

const count = useRef(0);

count.current++;

Common uses:

Store DOM
const inputRef = useRef();

inputRef.current.focus();
Store previous value
const previous = useRef(value);

useEffect(()=>{
 previous.current = value;
},[value]);
Store timers
const timer = useRef();

timer.current = setTimeout(...)
React Hooks Optimization
5. useTransition

For non-urgent updates.

Example:
Search input.

Without:

Typing
 |
Update state
 |
Filter 100k records
 |
UI freezes

With:

const [isPending,startTransition] = useTransition();

function search(value){
 setInput(value);

 startTransition(()=>{
   setResults(filter(value));
 });
}

React keeps UI responsive.

6. useDeferredValue

Delay expensive rendering.

Example:

const deferredSearch = useDeferredValue(search);

const results = useMemo(()=>{
 return expensiveSearch(deferredSearch)
},[deferredSearch]);

Useful for:

Search
Large tables
Charts
7. useId

Generate stable IDs.

Instead of:

Math.random()

Use:

const id = useId();

<input id={id}/>

Useful for:

Accessibility
SSR hydration
Component Optimization Techniques
8. Code splitting with lazy

Instead of loading everything:

import Dashboard from "./Dashboard";

Use:

const Dashboard = lazy(
 ()=>import("./Dashboard")
);

Then:

<Suspense fallback={<Loader/>}>
 <Dashboard/>
</Suspense>

Great for:

Admin panels
Routes
Heavy components
9. Virtualization for large lists

Bad:

users.map(user =>
 <UserCard/>
)

10,000 items = 10,000 DOM nodes.

Use:

React Window
TanStack Virtual

Example:

<VirtualList
 height={500}
 itemCount={10000}
/>

Only renders visible items.

10. Avoid unnecessary state

Bad:

const [fullName,setFullName]=useState("");

when:

const fullName =
 `${firstName} ${lastName}`;

Use derived data.

11. Keep state close to usage

Bad:

App
 |
100 components
 |
Button

State in App causes all children to re-render.

Better:

Button
 |
Own state
12. Use functional state updates

Bad:

setCount(count+1)

Better:

setCount(prev=>prev+1)

Especially:

setCount(prev=>prev+1)
setCount(prev=>prev+1)

will correctly become +2.

Data Fetching Optimization
13. Use caching libraries

Instead of:

useEffect(()=>{
 fetch()
},[])

Use:

TanStack Query
const {
 data,
 isLoading
}=useQuery({
 queryKey:["users"],
 queryFn:getUsers
});

Benefits:

Cache
Retry
Background refresh
Deduplication
Pagination
14. Debounce expensive events

Bad:

onChange={(e)=>{
 searchAPI(e.target.value)
}}

Every key hits API.

Better:

const search = debounce(
 value=>fetch(value),
 500
);
React Rendering Rules

A component re-renders when:

State changes
setState()
Parent renders
<App>
 <Child/>
</App>
Context value changes
<AuthContext.Provider value={user}>
Props reference changes
<Component data={{a:1}}/>
Context Optimization

Bad:

<AuthContext.Provider value={{
 user,
 login
}}>

Every render creates a new object.

Better:

const value = useMemo(()=>({
 user,
 login
}),[user]);

<AuthContext.Provider value={value}>
React 19 / Modern Optimizations
Compiler

React Compiler automatically handles many:

useMemo
useCallback
memoization

So manual optimization becomes less necessary.

Production Checklist

For a large React app:

✅ React.memo for expensive components
✅ useMemo for heavy calculations
✅ useCallback for stable handlers
✅ Lazy load routes
✅ Virtualize huge lists
✅ TanStack Query for API state
✅ Avoid unnecessary context updates
✅ Keep state local
✅ Debounce inputs
✅ Use React Profiler
✅ Analyze bundle with: