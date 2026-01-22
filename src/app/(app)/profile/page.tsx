import ProfileWidget from "@/components/profile/profile-widget"
import Post from "@/components/profile/post"
import ProfileListWidget from "@/components/profile/profile-list-widget";
import ViewSelector from "@/components/profile/view-selector";

export default function ProfilePage() {
  return (
    <div>
      <ProfileWidget
        profileName="Rafael Niebles"
        profileInstitution="Univ. of Central Florida"
        profileRole="Student"
        profileResearchInterest="Machine Learning"
        profileAbout="Hello this is my beautiful account"
        profileSkills={["JavaScript", "More JavaScript", "Even MORE JavaScript!", "More More JAVASCRIPT More!!!", "php...!?"]}
        profilePicURL="https://ih1.redbubble.net/image.5595885630.8128/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg"
        profileHeaderImageURL="https://external-preview.redd.it/r6g38aXSaQWtd1KxwJbQ-Fs5jtSVDxX3wtLHJEdqixw.jpg?width=1080&crop=smart&auto=webp&s=87a2c94cb3e1561e2b6abd467ea68d81b9901720"
      />

      <Post
        posterName="Rafael Niebles"
        posterResearchInterest="Machine Learning"
        posterProfilePicURL="https://ih1.redbubble.net/image.5595885630.8128/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg"
        attachmentPreviewURL="https://s3-eu-west-1.amazonaws.com/images.linnlive.com/d4cf250f63918acf8e5d11b6bfddb6ba/9250355b-75cf-42d8-957b-6d28c6aa930f.jpg"
        timestamp={new Date()}
        postText="I think JavaScript is a crime against humanity and it should be explodonated"
      />

      <ViewSelector />

      <ProfileListWidget
        widgetTitle="Following"
      />
      <ProfileListWidget
        widgetTitle="Friends"
        profiles={[
          {
            key: 0,
            posterName: "Beethoven",
            posterResearchInterest: "European Music",
            posterProfilePicURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsxuN8XD4da9_EVO8m6ZP4aECjlYM8mBkbTg&s"
          },
          {
            key: 1,
            posterName: "2Pac Shakur",
            posterResearchInterest: "Rap",
            posterProfilePicURL: "https://npr.brightspotcdn.com/dims4/default/3ef5a7e/2147483647/strip/true/crop/2814x2110+0+0/resize/880x660!/quality/90/?url=https%3A%2F%2Fmedia.npr.org%2Fassets%2Fimg%2F2013%2F07%2F18%2Frexusa_829701b1-31184c163596e9c44d777e61951e2324e3e49487.jpg"
          }
        ]}
      />
    </div >
  );
}
