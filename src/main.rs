mod profile;
mod user;

use profile::Profile;
use user::User;

fn main() {
    let user = User::new("Taylor", 29)
        .with_profile(Profile::new("Rustacean and workshop fan"));

    println!("{}", user.summary());
}
